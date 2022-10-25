import { Row, Col, Card, Button } from 'react-bootstrap';
import classes from './SaveModal.module.css';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Backdrop } from '../../../components/Modal';

import { useAppSelector } from '../../../hooks';
import config from '../../../config';

import { ComposableItemCard } from '../../../components/ComposableItemCard';

import { isApprovedForAll } from '../../../utils/composables/composablesContracts';	
import { TokenItem, ComposableItem, filterTokenItem } from '../../../utils/composables/composablesWrapper';	

import { useContractFunction } from '@usedapp/core';
import { Contract, utils } from 'ethers';
import NounsComposerABI from '../../../libs/abi/NounsComposer.json';
import ComposableItemABI from '../../../libs/abi/ComposableItem.json';
import BigNumber from 'bignumber.js';

const nounsComposerABI = new utils.Interface(NounsComposerABI);
const composableItemABI = new utils.Interface(ComposableItemABI);
const nounExtensions = config.composables.extensions;

const SaveModal: React.FC<{ tokenAddress: string, tokenId: number, composerProxyAddress: string, composedItems: ComposableItem[], collectionItems: ComposableItem[], previousChildTokens: TokenItem[], previousComposedChildTokens: TokenItem[], svg: string, onComplete: (saved: boolean) => void; }> = props => {
  const { tokenAddress, tokenId, composerProxyAddress, composedItems, collectionItems, previousChildTokens, previousComposedChildTokens, svg, onComplete } = props;
  
  const activeAccount = useAppSelector(state => state.account.activeAccount);  
  
  const [loadSetApproval, setLoadSetApproval] = useState<boolean>(false);  
  const [approvalTokenAddress, setApprovalTokenAddress] = useState<string>();
 
  let extensionName: string = '';
  for (const extension of nounExtensions) {
   		if (extension.tokenAddress.toLowerCase() === tokenAddress.toLowerCase()) {
  			extensionName = extension.name;
  		}
  }
  
  const itemName = extensionName + " " + (new BigNumber(tokenId.toString())).toString();
  
  const tokenTransferParams: any[] = [];
  const tokenPositionParams: any[] = [];
  
  const tokenInstructions: any[] = [];
  
  const tokenApprovals: string[] = [];
  
  for (let i = 0; i < composedItems.length; i++) {
  	const item: ComposableItem = composedItems[i];
  	
  	if (item != null && item.image) {
  		
  		const itemTokenAddress = item.tokenAddress;
  		const itemTokenId = new BigNumber(item.tokenId.toString());
  		
  		//check against child tokens already in the parent oken
  		const index = previousChildTokens.findIndex(child => (child.tokenAddress === itemTokenAddress && child.tokenId.isEqualTo(itemTokenId)));
		if (index === -1) {
			tokenTransferParams.push({tokenAddress: itemTokenAddress, tokenId: itemTokenId.toString(), amount: 1});
			if (tokenApprovals.indexOf(itemTokenAddress) === -1) {
				tokenApprovals.push(itemTokenAddress)
			}
			
			tokenInstructions.push({item: item, type: 'move', movement: 1, position: -1});
		}
  		  		
		//check if item is in a different position than before
		const token: TokenItem = previousComposedChildTokens[i];
		if (!(token != null && token.tokenAddress === itemTokenAddress && token.tokenId.isEqualTo(itemTokenId))) {
			tokenPositionParams.push({tokenAddress: itemTokenAddress, tokenId: itemTokenId.toString(), position1: i+1});			
			tokenInstructions.push({item: item, type: 'position', movement: 0, position: i+1});		
		}
	}		
  }

  const prevComposedChildTokens = collectionItems.filter(item => filterTokenItem(previousComposedChildTokens, item.tokenAddress, item.tokenId));
  //check the previous composed child tokens, if they're not in the current composed list, then remove the position from them
  for (let i = 0; i < prevComposedChildTokens.length; i++) {
	const child: ComposableItem = prevComposedChildTokens[i];
	
	const childTokenAddress = child.tokenAddress;
	const childTokenId = new BigNumber(child.tokenId.toString());

  	
  	const index = composedItems.filter(item => item != null && item.image).findIndex(item => (item.tokenAddress === childTokenAddress && item.tokenId.isEqualTo(childTokenId)));
  	if (index === -1) {
		tokenPositionParams.push({tokenAddress: childTokenAddress, tokenId: childTokenId.toString(), position1: 0});
		tokenInstructions.push({item: child, type: 'position', movement: 0, position: 0});		
  	}
  }  
  
  const nounsComposerContract = new Contract(
  	composerProxyAddress,
	nounsComposerABI
  );	  	

  const { send: receiveAndComposeChildBatchMixed, state: receiveAndComposeChildBatchMixedState } = useContractFunction(
    nounsComposerContract,
    'receiveAndComposeChildBatchMixed',
  );
    
  const saveHandler = async () => {

  	if (!activeAccount) {
  		return;
  	}

	let allApproved = true;
	
	for (let i = 0; i < tokenApprovals.length; i++) {
		const isApproved = await isApprovedForAll(tokenApprovals[i], activeAccount, composerProxyAddress);
		
			
		if (!isApproved) {
			setApprovalTokenAddress(tokenApprovals[i]);
			setLoadSetApproval(true);

			allApproved = false;
			break;
		}
	}

    //function receiveAndComposeChildBatchMixed(uint256 _tokenId, TokenTransferParams[] calldata _childrenReceive, TokenPositionParams[] calldata _childrenCompose) external nonReentrant {    	

	if (allApproved) {
	    receiveAndComposeChildBatchMixed(tokenId.toString(), tokenTransferParams, tokenPositionParams);
	}
  };
  
  useEffect(() => {    
    switch (receiveAndComposeChildBatchMixedState.status) {      
      case 'None':
        break;
      case 'PendingSignature':
        break;
      case 'Mining':
        break;
      case 'Success':
      	console.log('success', receiveAndComposeChildBatchMixedState.receipt);
      	onComplete(true);
      	
        break;
      case 'Fail':
      	console.log('fail', receiveAndComposeChildBatchMixedState?.errorMessage);      
        break;
      case 'Exception':
      	console.log('exception', receiveAndComposeChildBatchMixedState?.errorMessage);      
        break;
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiveAndComposeChildBatchMixedState]);
    
  return (
    <>
      {loadSetApproval && approvalTokenAddress && (
        <SetApproval
          tokenAddress={approvalTokenAddress}
          composerProxyAddress={composerProxyAddress}
          onComplete={(approved: boolean | undefined) => {

	        if (approved) {
          		saveHandler();
	        }

          	
            setLoadSetApproval(false);
          }}
        />
      )}
      {ReactDOM.createPortal(
        <Backdrop
          onDismiss={() => {
            onComplete(false);
          }}
        />,
        document.getElementById('backdrop-root')!,
      )}
      {ReactDOM.createPortal(
        <div className={classes.modal}>
	        <Row>
				<Col xs={4} lg={4} className={classes.imageSection}>
	        		<Card.Img variant="top" src={`data:image/svg+xml;base64,${btoa(svg)}`} />
	        	</Col>
				<Col xs={8} lg={8} className={classes.formSection}>

		            <div className={classes.title}>
		              <h2>
		                Review
		              </h2>
		              <h1>{itemName} </h1>
		            </div>
					<span style={{ fontSize: 'small' }}>
						Please review the transfer instructions below before committing the changes on-chain.
					</span>
					<br />
				</Col>
				<hr style={{ marginTop: '10px' }} />
			</Row>
			{tokenInstructions.map(token => (
		      	<Row className={classes.itemRows}>
			        <Col xs={2} md={2} lg={2} className={classes.itemGroup}>
			        	<ComposableItemCard composableItem={token.item} onlyThumbnail={true} />
			        </Col>
			        <Col xs={10} md={10} lg={10} className={classes.itemGroup} style={{paddingTop: '10px'}}>
			          { (token.type === "move") && (token.movement > 0) && (
			          	<span>Moving into your Noun</span>
			          )}
			          { (token.type === "move") && (token.movement < 0) && (
			          	<span>Moving out of your Noun</span>
			          )}			          
			          { (token.type === "position") && (token.position > 0) && (
			          	<span>Placing at position {token.position}</span>
			          )}
			          { (token.type === "position") && (token.position === 0) && (
			          	<span>Removing from its placed position</span>
			          )}			          
			        </Col>
				</Row>
	      	))}
			{loadSetApproval && approvalTokenAddress && (
				<Row>
					<Col xs={12} lg={12} className={classes.formSection} style={{ textAlign: 'center' }}>
						<span style={{fontWeight: 'bold'}} >
							Please confirm the approval request via your wallet first.
						</span>
						<br />
						<span style={{fontSize: 'small'}} >
							This will allow the Composer to move the requested items into your Noun.
						</span>
					</Col>
				</Row>
			)}
			<Row>
				<Col xs={12} lg={12} className={classes.formSection} style={{ textAlign: 'center' }}>
					<br />
					<Button onClick={() => saveHandler()} className={classes.primaryBtn}>
		              Save
		            </Button>
				</Col>
			</Row>
        </div>,
        document.getElementById('overlay-root')!,
      )}
    </>
  );
};

const SetApproval: React.FC<{ tokenAddress: string, composerProxyAddress: string, onComplete: (approved: boolean) => void; }> = props => {
  const { tokenAddress, composerProxyAddress, onComplete } = props;
  
  const activeAccount = useAppSelector(state => state.account.activeAccount);  

  const composableItemContract = new Contract(
  	tokenAddress,
	composableItemABI
  );	  	

  const { send: setApprovalForAll, state: setApprovalForAllState } = useContractFunction(
    composableItemContract,
    'setApprovalForAll',
  );
  
  useEffect(() => {

    if (activeAccount) {

    	setApprovalForAll(composerProxyAddress, true);

    }    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAccount]);  
  

  useEffect(() => {    
    switch (setApprovalForAllState.status) {
      case 'None':
        break;
      case 'PendingSignature':
        break;
      case 'Mining':
        break;
      case 'Success':
      	console.log('success', setApprovalForAllState.receipt);
      	onComplete(true);
      	
        break;
      case 'Fail':
      	console.log('fail', setApprovalForAllState?.errorMessage);      
        break;
      case 'Exception':
      	console.log('exception', setApprovalForAllState?.errorMessage);      
        break;
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setApprovalForAllState]);

  return (
    <>    	
    </>
  );
};

export default SaveModal;
