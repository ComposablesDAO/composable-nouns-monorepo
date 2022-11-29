import { Row, Col, Button, Spinner } from 'react-bootstrap';
import classes from './ListingHistory.module.css';
import React, { useEffect, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Backdrop } from '../../../components/Modal';

import { useAppSelector, useAppDispatch } from '../../../hooks';
import config from '../../../config';
import { AlertModal, setAlertModal } from '../../../state/slices/application';

import { ComposableItemCard } from '../../../components/ComposableItemCard';

import { getSellerBalance } from '../../../utils/composables/composablesContracts';	
import { ComposableItem, filterComposableItem,
	ComposablesMarketListing, getComposablesMarketListingsFilled } from '../../../utils/composables/composablesWrapper';	

import { useContractFunction } from '@usedapp/core';
import { Contract, utils } from 'ethers';
import ComposablesMarketABI from '../../../libs/abi/ComposablesMarket.json';
import BigNumber from 'bignumber.js';

const composablesMarketABI = new utils.Interface(ComposablesMarketABI);
const composablesMarketAddress = config.composables.composablesMarketProxy;

const getTruncatedAmount = (amount: BigNumber): string => {
	const eth = new BigNumber(utils.formatEther(amount.toString())).toFixed(4);
	return `Ξ ${eth}`;
}

const ListingHistory: React.FC<{ tokenAddress: string, collectionItems: ComposableItem[], onComplete: (updated: boolean) => void; }> = props => {
  const { tokenAddress, collectionItems, onComplete } = props;
    
  const [listingsFilled, setListingsFilled] = useState<ComposablesMarketListing[]>();
  const [sellerBalance, setSellerBalance] = useState<BigNumber | undefined>(undefined);
  const [withdrawButtonContent, setWithdrawButtonContent] = useState({ loading: false, content: <>Withdraw</>});

  const activeAccount = useAppSelector(state => state.account.activeAccount);  

  const dispatch = useAppDispatch();
  const setModal = useCallback((modal: AlertModal) => dispatch(setAlertModal(modal)), [dispatch]);

  useEffect(() => {

    if (tokenAddress && activeAccount) {

	    const loadListingsFilled = async () => {

	    	const listingsFilled = await getComposablesMarketListingsFilled(undefined, tokenAddress);
	    	
	    	const balance = await getSellerBalance(activeAccount);

	    	setListingsFilled(listingsFilled);
	    	setSellerBalance(new BigNumber(balance.toString()));
	    };
	    
		loadListingsFilled();
    }    

  }, [tokenAddress, activeAccount]);
  
  
  const composablesMarketContract = new Contract(
  	composablesMarketAddress,
	composablesMarketABI
  );	  	

  const { send: withdraw, state: withdrawState } = useContractFunction(
    composablesMarketContract,
    'withdraw',
  );
    
  const withdrawHandler = async () => {

  	if (!activeAccount || sellerBalance === undefined || sellerBalance.isZero()) {
  		return;
  	}
  	
	withdraw(activeAccount, sellerBalance.toString());
  };
  
  useEffect(() => {    
    switch (withdrawState.status) {      
      case 'None':
      	setWithdrawButtonContent({ loading: false, content: <>Withdraw</> });
        break;
      case 'PendingSignature':
      	setWithdrawButtonContent({ loading: true, content: <></> });
        break;
      case 'Mining':
      	setWithdrawButtonContent({ loading: true, content: <></> });
        break;
      case 'Success':
      	console.log('success', withdrawState.receipt);
      	onComplete(true);

      	setModal({
	    	title: <>Success</>,
	    	message: <>Withdraw successfully processed on-chain!</>,
	    	show: true,
	  	});
      	setWithdrawButtonContent({ loading: false, content: <>Withdraw</> });
      	
        break;
      case 'Fail':
      	setModal({
	    	title: <>Transaction Failed</>,
	    	message: withdrawState?.errorMessage || <>Please try again.</>,
	    	show: true,
	  	});

      	setWithdrawButtonContent({ loading: false, content: <>Withdraw</> });
        break;
      case 'Exception':
      	setModal({
	    	title: <>Transaction Error</>,
	    	message: withdrawState?.errorMessage || <>Please try again.</>,
	    	show: true,
	  	});

      	setWithdrawButtonContent({ loading: false, content: <>Withdraw</> });
        break;
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withdrawState]);

  const isDisabled = withdrawState.status === 'Mining' || !activeAccount || sellerBalance === undefined || sellerBalance.isZero();

  return (
    <>
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
				<Col xs={12} lg={12} className={classes.formSection}>

		            <div className={classes.title}>
		              <h2>
		                Sales
		              </h2>
		              <h1>History </h1>
		            </div>
					<span style={{ fontSize: 'small' }}>
						You can review the sales history for your collection and withdraw proceeds to your wallet.
					</span>
					<br />
				</Col>
				<hr style={{ marginTop: '10px' }} />
			</Row>
			{listingsFilled && (
				listingsFilled.map(listing => (
			      	<Row className={classes.itemRows}>
				        <Col xs={2} md={2} lg={2} className={classes.itemGroup}>
				        	<ComposableItemCard composableItem={filterComposableItem(collectionItems, listing.tokenAddress, listing.tokenId)!} onlyThumbnail={true} />
				        </Col>
				        <Col xs={10} md={10} lg={10} className={classes.itemGroup} style={{paddingTop: '10px'}}>
				          	<span>{listing.quantity.toString()} item{listing.quantity.isGreaterThan(new BigNumber(1)) ? 's' : '' } sold for {getTruncatedAmount(listing.price)}</span>
				          	<br />
				          	<span style={{fontSize: 'small', fontStyle: 'italic'}}>Subtotal: {getTruncatedAmount(listing.quantity.multipliedBy(listing.price))}</span>
				        </Col>
					</Row>
		      	))				
			)}
			<Row>
				<Col xs={12} lg={12} className={classes.formSection} style={{ textAlign: 'center' }}>
					<br />
					<Button onClick={() => withdrawHandler()} className={classes.primaryBtn} disabled={isDisabled}>
		              {withdrawButtonContent.loading ? <Spinner animation="border" size="sm" /> : withdrawButtonContent.content} {(!withdrawButtonContent.loading && sellerBalance !== undefined) ? getTruncatedAmount(sellerBalance) : ''}
		            </Button>
				</Col>
			</Row>
        </div>,
        document.getElementById('overlay-root')!,
      )}
    </>
  );
};

export default ListingHistory;
