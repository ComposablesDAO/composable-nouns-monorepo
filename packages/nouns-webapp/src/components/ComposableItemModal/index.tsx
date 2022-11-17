import { Row, Col, Card, Button, InputGroup, Form, Spinner } from 'react-bootstrap';
import classes from './ComposableItemModal.module.css';
import React, { useEffect, useRef, useCallback, useState } from 'react';
import ReactDOM from 'react-dom';
import { Backdrop } from '../Modal';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import TruncatedAmount from '../TruncatedAmount';

import { useAppSelector, useAppDispatch } from '../../hooks';
import config from '../../config';
import { AlertModal, setAlertModal } from '../../state/slices/application';

import { buildSVG } from '../../utils/composables/nounsSDK';

import { ComposableItem, ComposablesMarketListing } from '../../utils/composables/composablesWrapper';	

import { useContractFunction } from '@usedapp/core';
import { Contract, utils } from 'ethers';
import ComposablesMarketABI from '../../libs/abi/ComposablesMarket.json';
import BigNumber from 'bignumber.js';

const composablesMarketABI = new utils.Interface(ComposablesMarketABI);
const composablesMarketAddress = config.composables.composablesMarketProxy;

const getTruncatedAmount = (amount: BigNumber): string => {
	const eth = new BigNumber(utils.formatEther(amount.toString())).toFixed(2);
	return `Ξ ${eth}`;
};

const ComposableItemModal: React.FC<{ composableItem: ComposableItem, listing?: ComposablesMarketListing, onComplete: (listingId: number | undefined) => void; }> = props => {
  const { composableItem, listing, onComplete } = props;

  const [fillButtonContent, setFillButtonContent] = useState({ loading: false, content: <>Buy</>});

  const activeAccount = useAppSelector(state => state.account.activeAccount);

  const dispatch = useAppDispatch();
  const setModal = useCallback((modal: AlertModal) => dispatch(setAlertModal(modal)), [dispatch]);  

  const filename = composableItem.image.filename;
  const data = composableItem.image.data;
  const palette = composableItem.image.palette;
  
  const part = {
  	"filename": filename,
	"data": data,
  };
  const parts = [ part ];
  const svg = buildSVG(parts, palette, 'fff');
  
  const collectionName = composableItem.collection;
  const creatorName = composableItem.meta.creator;
  const categoryName = composableItem.meta.category;
  const itemName = composableItem.meta.name;
  const tokenAddress = composableItem.tokenAddress;
    
  const priceInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const maxInputRef = useRef<HTMLInputElement>(null);
  
  const composablesMarketContract = new Contract(
  	composablesMarketAddress,
	composablesMarketABI
  );	  	

  const { send: fillListing, state: fillListingState } = useContractFunction(
    composablesMarketContract,
    'fillListing',
  );
    
  const fillListingHandler = async () => {

  	if (!activeAccount) {
  		return;
  	}

  	if (!listing) {
  		return;
  	}
  	
    if (!quantityInputRef.current || !quantityInputRef.current.value) {
      return;
    }

    const fillPrice = listing.price;
    const fillQuantity = new BigNumber(quantityInputRef.current.value.toString());
    const fillTotal = fillPrice.multipliedBy(fillQuantity);
    const value = fillTotal.toString();

    fillListing(listing.listingId.toString(), fillQuantity.toString(), {
      value
    });
  };  

  useEffect(() => {    

    switch (fillListingState.status) {      
      case 'None':
      	setFillButtonContent({ loading: false, content: <>Buy</> });
        break;
      case 'PendingSignature':
      	setFillButtonContent({ loading: true, content: <></> });
        break;
      case 'Mining':
      	setFillButtonContent({ loading: true, content: <></> });
        break;
      case 'Success':
      	console.log('success', fillListingState.receipt);
      	onComplete(undefined);

      	setModal({
	    	title: <>Success</>,
	    	message: <>Item successfully purchased on-chain! <br /><br /> <Button href="/composer" className={classes.primaryBtn}>Go to Composer</Button></>,
	    	show: true,
	  	});
      	setFillButtonContent({ loading: false, content: <>Buy</> });
      	
        break;
      case 'Fail':
      	setModal({
	    	title: <>Transaction Failed</>,
	    	message: fillListingState?.errorMessage || <>Please try again.</>,
	    	show: true,
	  	});

      	setFillButtonContent({ loading: false, content: <>Buy</> });
        break;
      case 'Exception':
      	setModal({
	    	title: <>Transaction Error</>,
	    	message: fillListingState?.errorMessage || <>Please try again.</>,
	    	show: true,
	  	});

      	setFillButtonContent({ loading: false, content: <>Buy</> });
        break;
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fillListingState]);
  
  
  const isDisabled = fillListingState.status === 'Mining' || !activeAccount;

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
	        <Row>
				<Col xs={4} lg={4} className={classes.imageSection}>
	        		<Card.Img variant="top" src={`data:image/svg+xml;base64,${btoa(svg)}`} />
	        	</Col>
				<Col xs={8} lg={8} className={classes.formSection}>

		            <div className={classes.title}>
		              <h2>
		                Item Detail
		              </h2>
		              <h1>{itemName} </h1>
		            </div>	        	
					<Card.Text style={{ paddingTop: '0rem', fontSize: 'small' }}>	       
				      	<span><a style={{ textDecoration: 'none', fontWeight: 'bold', color: 'inherit' }} href={`/collection/${tokenAddress}`}>{collectionName}</a></span>
				      	<br />	      	
				      	<span style={{ fontStyle: 'italic' }}>{categoryName}</span>
				      	<br />
				      	<span style={{ color: 'gray' }}><FontAwesomeIcon icon={faUser} /> {creatorName}</span>
				      	{listing && (
				      		<>
				      		<br />
					      	<TruncatedAmount amount={listing.price} />
					      	</>
					    )}
					</Card.Text>
					<br /><br />
				</Col>
			</Row>
			{listing && (				
				<InputGroup>
					<Row>
						<Col xs={4} lg={4} className={classes.formSection}>
							<Form.Label htmlFor="txtPrice" style={{ fontWeight: 'bold'}}>Price</Form.Label>
							<Form.Control 
							id="txtPrice"
							type="text"
							maxLength={10} 
							style={{ maxWidth: '100px' }} 
							ref={priceInputRef} 
							value={getTruncatedAmount(listing.price)}
							disabled
							/>
						</Col>
						<Col xs={4} lg={4} className={classes.formSection}>
		
							<Form.Label htmlFor="txtQuantity" style={{ fontWeight: 'bold'}}>Quantity</Form.Label>
							<Form.Control 
							id="txtQuantity"
							type="number"
							min="0" 
							placeholder="1" 
							maxLength={10} 
							style={{ maxWidth: '100px' }} 
							ref={quantityInputRef} 
							/>		
						</Col>
						<Col xs={4} lg={4} className={classes.formSection}>
		
							<Form.Label htmlFor="txtMax" style={{ fontWeight: 'bold'}}>Max per wallet</Form.Label>
							<Form.Control 
							id="txtMax"
							type="text"
							min="0" 
							placeholder="3" 
							maxLength={10} 
							style={{ maxWidth: '100px' }} 
							ref={maxInputRef} 
							value={listing.maxPerAddress.toString()}
							disabled
							/>
						</Col>
		
						<Col xs={12} lg={12} className={classes.formSection} style={{ textAlign: 'center' }}>
							<p style={{fontSize: 'small'}}>
								Please indicate the item quantity you would like to purchase.
							</p>
							<Button onClick={() => fillListingHandler()} className={classes.primaryBtn} disabled={isDisabled}>
				              {fillButtonContent.loading ? <Spinner animation="border" size="sm" /> : fillButtonContent.content}
				            </Button>
				        </Col>
					</Row>
				</InputGroup>
			)}
        </div>,
        document.getElementById('overlay-root')!,
      )}
    </>
  );
};

export default ComposableItemModal;
