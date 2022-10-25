import { Row, Col, Button, Form } from 'react-bootstrap';

import classes from './ListingForm.module.css';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Backdrop } from '../../../components/Modal';

import { useAppSelector } from '../../../hooks';
import config from '../../../config';

import { ComposableItemCard } from '../../../components/ComposableItemCard';
import { ComposableItem, ComposablesMarketListing } from '../../../utils/composables/composablesWrapper';	

import { useContractFunction } from '@usedapp/core';
import { Contract, utils } from 'ethers';
import ComposablesMarketABI from '../../../libs/abi/ComposablesMarket.json';
import BigNumber from 'bignumber.js';

const composablesMarketABI = new utils.Interface(ComposablesMarketABI);
const composablesMarketAddress = config.composables.composablesMarketProxy;

const getTruncatedAmount = (amount: BigNumber): string => {
	const eth = new BigNumber(utils.formatEther(amount.toString())).toFixed(2);
	return `Ξ ${eth}`;
};

const ListingForm: React.FC<{ composableItems: ComposableItem[], listing?: ComposablesMarketListing, onComplete: (action: number | undefined) => void; }> = props => {
  const { composableItems, listing, onComplete } = props;
    
  const [formInputs, setFormInputs] = useState<Record<string, string>>({});
    
  const activeAccount = useAppSelector(state => state.account.activeAccount);
  
  const composablesMarketContract = new Contract(
  	composablesMarketAddress,
	composablesMarketABI
  );	  	

  const { send: createListingBatch, state: createListingState } = useContractFunction(
    composablesMarketContract,
    'createListingBatch',
  );

  const { send: deleteListing, state: deleteListingState } = useContractFunction(
    composablesMarketContract,
    'deleteListing',
  );

  const createListingHandler = async () => {

  	if (!activeAccount) {
  		return;
  	}

  	if (validateFormInputs()) {


		const arrTokenAddress: string[] = [];
		const arrTokenId: string[] = [];

		const arrPrice: string[] = [];
		const arrQuantity: string[] = [];
		const arrMax: string[] = [];

		for (let i = 0; i < composableItems.length; i++) {			
			arrTokenAddress.push(composableItems[i].tokenAddress);
			arrTokenId.push(composableItems[i].tokenId.toString());
			
			arrPrice.push(new BigNumber(utils.parseEther(formInputs['txtPrice' + i.toString()]).toString()).toString());
			arrQuantity.push(new BigNumber(formInputs['txtQuantity' + i.toString()]).toString());
			arrMax.push(new BigNumber(formInputs['txtMax' + i.toString()]).toString());
		}
		
	    createListingBatch(arrTokenAddress, arrTokenId, arrPrice, arrQuantity, arrMax);
	}
  };
  
  const deleteListingHandler = async () => {

  	if (!activeAccount && !listing) {
  		return;
  	}
  	
  	deleteListing(listing!.listingId.toString());
  };  
  

  useEffect(() => {    
    switch (createListingState.status) {      
      case 'None':
        break;
      case 'PendingSignature':
        break;
      case 'Mining':
        break;
      case 'Success':
      	console.log('success', createListingState.receipt);
      	onComplete(1); //to trigger toggle reload
      	      	
        break;
      case 'Fail':
      	console.log('fail', createListingState?.errorMessage);      
        break;
      case 'Exception':
      	console.log('exception', createListingState?.errorMessage);      
        break;
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createListingState]);

  useEffect(() => {
    switch (deleteListingState.status) {      
      case 'None':
        break;
      case 'PendingSignature':
        break;
      case 'Mining':
        break;
      case 'Success':
      	console.log('success', deleteListingState.receipt);
      	onComplete(1); //to trigger toggle reload
      	      	
        break;
      case 'Fail':
      	console.log('fail', deleteListingState?.errorMessage);      
        break;
      case 'Exception':
      	console.log('exception', deleteListingState?.errorMessage);      
        break;
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteListingState]);

  const onFormInputChange = (e: any) => {
  	setFormInputs({
	    ...formInputs,
	    [e.target.id]: e.target.value
  	});
  }

  const validateFormInputs = (): boolean => {
  	let isValid: boolean = true;

	for (let i = 0; i < composableItems.length; i++) {
		if (!formInputs['txtPrice' + i.toString()] || !formInputs['txtPrice' + i.toString()] || !formInputs['txtPrice' + i.toString()].trim()) {
      		isValid = false;
    	}

		if (!formInputs['txtQuantity' + i.toString()] || !formInputs['txtQuantity' + i.toString()] || !formInputs['txtQuantity' + i.toString()].trim()) {
      		isValid = false;
    	}

		if (!formInputs['txtMax' + i.toString()] || !formInputs['txtMax' + i.toString()] || !formInputs['txtMax' + i.toString()].trim()) {
      		isValid = false;
    	}
  	}  	
  	
  	return isValid;
  };
  
  const saveEnabled = validateFormInputs();
    
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
          <h2>{(listing) ? 'Edit Listing' : 'New Listing'}</h2>
          {(listing) ? 'Review your listed item on the Composables Market.' : 'Create a new listing for your items on the Composables Market.'}
			<br /><br />
			{!listing && composableItems.length > 0 && (
			<>	
			{composableItems.map((item, index) => (
					<Row className={classes.itemRows}>

				        <Col xs={2} md={2} lg={2} className={classes.itemGroup}>
				        	<ComposableItemCard composableItem={item} onlyThumbnail={true} />
				        </Col>
					
						<Col xs={3} md={3} lg={3} className={classes.formSection}>
							<Form.Label htmlFor={"txtPrice" + index} style={{ fontWeight: 'bold'}}>Price</Form.Label>
							<Form.Control 
							id={"txtPrice" + index}
							type="number"
							min="0" 
							required
							placeholder="0.01" 
							maxLength={10} 
							style={{ maxWidth: '100px' }} 
							onChange={onFormInputChange}
							/>
						</Col>
						<Col xs={3} md={3} lg={3} className={classes.formSection}>
							<Form.Label htmlFor={"txtQuantity" + index} style={{ fontWeight: 'bold'}}>Quantity</Form.Label>
							<Form.Control 
							id={"txtQuantity" + index}
							type="number"
							min="0" 
							required
							placeholder="100" 
							maxLength={10} 
							style={{ maxWidth: '100px' }} 
							onChange={onFormInputChange}
							/>
						</Col>
						<Col xs={3} md={3} lg={3} className={classes.formSection}>
							<Form.Label htmlFor={"txtMax" + index} style={{ fontWeight: 'bold'}}>Max</Form.Label>
							<Form.Control 
							id={"txtMax" + index}
							type="number"
							min="0" 
							required
							placeholder="0" 
							maxLength={10} 
							style={{ maxWidth: '100px' }} 
							onChange={onFormInputChange}
							/>
						</Col>
					</Row>
			))}
				<Row>					
					<Col xs={12} lg={12} className={classes.formSection} style={{ textAlign: 'center' }}>
						<br />
						<Button onClick={() => createListingHandler()} disabled={!saveEnabled} className={classes.primaryBtn}>
			              List On-Chain
			            </Button>
			            <br />
	
						<Button onClick={() => onComplete(undefined)} className={classes.primaryBtnOptions}>
			              More
			            </Button>		            
			            &nbsp;
						<Button onClick={() => onComplete(-1)} className={classes.primaryBtnOptions}>
			              Reset
			            </Button>		            
			        </Col>
				</Row>
			</>
			)}
			
			{listing && (
				<>
				<Row className={classes.itemRows}>

					<Col xs={3} md={3} lg={3} className={classes.formSection}>
						<Form.Label htmlFor={"txtPrice"} style={{ fontWeight: 'bold'}}>Price</Form.Label>
						<Form.Control 
						id={"txtPrice"}
						type="text"
						required
						maxLength={10} 
						style={{ maxWidth: '100px' }} 
						value={getTruncatedAmount(listing.price)}
						disabled
						/>
					</Col>
					<Col xs={3} md={3} lg={3} className={classes.formSection}>
						<Form.Label htmlFor={"txtQuantity"} style={{ fontWeight: 'bold'}}>Quantity</Form.Label>
						<Form.Control 
						id={"txtQuantity"}
						type="number"
						min="0" 
						required
						placeholder="100" 
						maxLength={10} 
						style={{ maxWidth: '100px' }} 
						value={listing.quantity.toString()}
						disabled
						/>
					</Col>
					<Col xs={3} md={3} lg={3} className={classes.formSection}>
						<Form.Label htmlFor={"txtMax"} style={{ fontWeight: 'bold'}}>Max</Form.Label>
						<Form.Control 
						id={"txtMax"}
						type="text"
						required
						maxLength={10} 
						style={{ maxWidth: '100px' }} 
						value={listing.maxPerAddress.toString()}
						disabled
						/>
					</Col>
				</Row>
				<Row>					
					<Col xs={12} lg={12} className={classes.formSection} style={{ textAlign: 'center' }}>
						<Button onClick={() => deleteListingHandler()} className={classes.primaryBtn}>
			              Remove Listing
			            </Button>
			        </Col>
				</Row>
				</>
			)}

        </div>,
        document.getElementById('overlay-root')!,
      )}
    </>
  );
};
export default ListingForm;
