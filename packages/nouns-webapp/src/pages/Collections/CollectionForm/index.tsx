import { Row, Col, Button, InputGroup, Form } from 'react-bootstrap';

import classes from './CollectionForm.module.css';
import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Backdrop } from '../../../components/Modal';

import { useAppSelector } from '../../../hooks';
import config from '../../../config';

import { predictCollectionAddress } from '../../../utils/composables/composablesContracts';

import { useContractFunction } from '@usedapp/core';
import { Contract, providers, utils } from 'ethers';
import ComposableItemFactoryABI from '../../../libs/abi/ComposableItemFactory.json';

const composableItemFactoryABI = new utils.Interface(ComposableItemFactoryABI);
const composableItemFactoryAddress = config.composables.composableItemFactory;


const CollectionForm: React.FC<{ onComplete: (tokenAddress: string | undefined) => void; }> = props => {
  const { onComplete } = props;
  
  const [tokenAddress, setTokenAddress] = useState<string>();

  const activeAccount = useAppSelector(state => state.account.activeAccount);

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
        break;
      case 'PendingSignature':
        break;
      case 'Mining':
        break;
      case 'Success':
      	console.log('success', createCollectionState.receipt);
      	onComplete(tokenAddress);
      	
        break;
      case 'Fail':
      	console.log('fail', createCollectionState?.errorMessage);      
        break;
      case 'Exception':
      	console.log('exception', createCollectionState?.errorMessage);      
        break;
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createCollectionState]);
  
    
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
						<Form.Label htmlFor="txtName" style={{ fontWeight: 'bold'}}>Name</Form.Label>
						<Form.Control 
						id="txtName"
						type="text" 
						placeholder="Name" 
						maxLength={32} 
						style={{ maxWidth: '300px' }} 
						ref={nameInputRef} 
						aria-describedby="txtNameHelp"
						/>
						<Form.Text id="txtNameHelp" muted>Collection name, max length: 32 chars</Form.Text>
					</Col>

					<Col xs={12} lg={12} className={classes.formSection}>
						<Form.Label htmlFor="txtSymbol" style={{ fontWeight: 'bold'}}>Symbol</Form.Label>
						<Form.Control 
						id="txtSymbol"
						type="text" 
						placeholder="Symbol" 
						maxLength={10} 
						style={{ maxWidth: '300px' }} 
						ref={symbolInputRef} 
						aria-describedby="txtSymbolHelp"
						/>
						<Form.Text id="txtSymbolHelp" muted>Collection symbol, max length: 10 chars</Form.Text>
					</Col>
					<Col xs={12} lg={12} className={classes.formSection} style={{ textAlign: 'center' }}>
						<br />
						<Button onClick={() => createTokenHandler()} className={classes.primaryBtn} >
			              Mint
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
