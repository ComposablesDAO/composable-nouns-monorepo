import { Row, Col, Button, InputGroup, Form, Spinner } from 'react-bootstrap';

import classes from './CollectionForm.module.css';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Backdrop } from '../../../components/Modal';
import TooltipInfo from '../../../components/TooltipInfo';

import { useAppSelector, useAppDispatch } from '../../../hooks';
import config from '../../../config';
import { AlertModal, setAlertModal } from '../../../state/slices/application';

import { predictCollectionAddress } from '../../../utils/composables/composablesContracts';

import { useContractFunction } from '@usedapp/core';
import { Contract, providers, utils } from 'ethers';
import ComposableItemFactoryABI from '../../../libs/abi/ComposableItemFactory.json';

const composableItemFactoryABI = new utils.Interface(ComposableItemFactoryABI);
const composableItemFactoryAddress = config.composables.composableItemFactory;


const CollectionForm: React.FC<{ onComplete: (tokenAddress: string | undefined) => void; }> = props => {
  const { onComplete } = props;

  const [createButtonContent, setCreateButtonContent] = useState({ loading: false, content: <>Mint</>});
  
  const [tokenAddress, setTokenAddress] = useState<string>();

  const activeAccount = useAppSelector(state => state.account.activeAccount);

  const dispatch = useAppDispatch();
  const setModal = useCallback((modal: AlertModal) => dispatch(setAlertModal(modal)), [dispatch]);  

  const nameInputRef = useRef<HTMLInputElement>(null);
  const symbolInputRef = useRef<HTMLInputElement>(null);
  
  const composableItemFactoryContract = new Contract(
  	composableItemFactoryAddress,
	composableItemFactoryABI
  );	  	

  const { send: createCollection, state: createCollectionState } = useContractFunction(
    composableItemFactoryContract,
    'createCollection',
  );

  const createTokenHandler = async () => {

  	if (!activeAccount) {
  		return;
  	}

    if (!nameInputRef.current || !nameInputRef.current.value || !nameInputRef.current.value.trim()) {
      return;
    }

    if (!symbolInputRef.current || !symbolInputRef.current.value || !symbolInputRef.current.value.trim()) {
      return;
    }    
        
  	const jsonRpcProvider = new providers.JsonRpcProvider(config.app.jsonRpcUri);
  	const nonce = await jsonRpcProvider.getTransactionCount(activeAccount!);

  	const name = nameInputRef.current?.value.trim();
  	const symbol = symbolInputRef.current?.value.trim().toUpperCase();

	const address = await predictCollectionAddress(activeAccount, nonce);
	
	setTokenAddress(address);

    createCollection(name, symbol, nonce.toString());
  };  

  useEffect(() => {    
    switch (createCollectionState.status) {      
      case 'None':
      	setCreateButtonContent({ loading: false, content: <>Mint</> });
        break;
      case 'PendingSignature':
      	setCreateButtonContent({ loading: true, content: <></> });
        break;
      case 'Mining':
      	setCreateButtonContent({ loading: true, content: <></> });
        break;
      case 'Success':
      	console.log('success', createCollectionState.receipt);
      	onComplete(tokenAddress);

      	setModal({
	    	title: <>Success</>,
	    	message: <>Collection successfully created on-chain!</>,
	    	show: true,
	  	});
      	setCreateButtonContent({ loading: false, content: <>Mint</> });
      	
        break;
      case 'Fail':
      	setModal({
	    	title: <>Transaction Failed</>,
	    	message: createCollectionState?.errorMessage || <>Please try again.</>,
	    	show: true,
	  	});

      	setCreateButtonContent({ loading: false, content: <>Mint</> });
        break;
      case 'Exception':
      	setModal({
	    	title: <>Transaction Error</>,
	    	message: createCollectionState?.errorMessage || <>Please try again.</>,
	    	show: true,
	  	});

      	setCreateButtonContent({ loading: false, content: <>Mint</> });
        break;
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createCollectionState]);

  const isDisabled = createCollectionState.status === 'Mining' || !activeAccount;

  return (
    <>
      {ReactDOM.createPortal(
        <Backdrop
          onDismiss={() => {
            onComplete(undefined);
          }}
        />,
        document.getElementById('backdrop-root')!,
      )}
      {ReactDOM.createPortal(
        <div className={classes.modal}>
          <h2>New Collection</h2>
          Create a new collection on-chain in just a few simple steps.
			<br /><br />
			<InputGroup>
				<Row>
					<Col xs={12} lg={12} className={classes.formSection}>
						<Form.Label htmlFor="txtName" style={{ fontWeight: 'bold'}}>Name <TooltipInfo tooltipText={"This is how your collection will be shown on marketplaces like Composables, Opensea and Rarible."} /></Form.Label>
						<Form.Control 
						id="txtName"
						type="text" 
						placeholder="Name" 
						maxLength={32} 
						style={{ maxWidth: '300px' }} 
						ref={nameInputRef} 
						aria-describedby="txtNameHelp"
						/>
						<Form.Text id="txtNameHelp" muted>Collection name, e.g. "Bored Ape Yacht Club"</Form.Text>
					</Col>

					<Col xs={12} lg={12} className={classes.formSection}>
						<Form.Label htmlFor="txtSymbol" style={{ fontWeight: 'bold'}}>Symbol <TooltipInfo tooltipText={"This is visible on Etherscan and other on-chain explorers."} /></Form.Label>
						<Form.Control 
						id="txtSymbol"
						type="text" 
						placeholder="Symbol" 
						maxLength={10} 
						style={{ maxWidth: '300px' }} 
						ref={symbolInputRef} 
						aria-describedby="txtSymbolHelp"
						/>
						<Form.Text id="txtSymbolHelp" muted>Collection symbol, e.g. "APE"</Form.Text>
					</Col>
					<Col xs={12} lg={12} className={classes.formSection} style={{ textAlign: 'center' }}>
						<br />
						<Button onClick={() => createTokenHandler()} className={classes.primaryBtn} disabled={isDisabled}>
			              {createButtonContent.loading ? <Spinner animation="border" size="sm" /> : createButtonContent.content}
			            </Button>
			        </Col>
				</Row>			              
			</InputGroup>

        </div>,
        document.getElementById('overlay-root')!,
      )}
    </>
  );
};
export default CollectionForm;
