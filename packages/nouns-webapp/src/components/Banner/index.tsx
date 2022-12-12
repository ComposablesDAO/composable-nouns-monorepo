import classes from './Banner.module.css';
import Section from '../../layout/Section';
import { Row, Col } from 'react-bootstrap';

import { useEffect, useState } from 'react';
import { ComposableItemCollection, getComposableItemCollections, 
	ComposableItem, getComposableItemsBatch, ComposablesMarketListing, getComposablesMarketListings, getCollectionInfoBatch,
	getCountComposableItemCollections, getCountComposableItems, getSumMarketListingsFilled } from '../../utils/composables/composablesWrapper';
import { ComposableItemCollectionRows } from '../../components/ComposableItemCollectionRow';
import Link from '../../components/Link';
import TruncatedAmount from '../TruncatedAmount';

import config from '../../config';
import { useEtherBalance } from '@usedapp/core';
import { useAppSelector } from '../../hooks';

const Banner = () => {


  const [initLoad, setInitLoad] = useState<boolean>(true);
  const [collections, setCollections] = useState<ComposableItemCollection[] | undefined>(undefined);
  const [collectionItems, setCollectionItems] = useState<ComposableItem[] | undefined>(undefined);
  const [listings, setListings] = useState<ComposablesMarketListing[]>();
  const [collectionInfos, setCollectionInfos] = useState<Record<string, any>[] | undefined>(undefined);

  const [countCollections, setCountCollections] = useState<number>();
  const [countCollectionItems, setCountCollectionItems] = useState<number>();
  const [sumMarketListingsFilled, setSumMarketListingsFilled] = useState<any>();

  const ethBalance = useEtherBalance(config.addresses.nounsDaoExecutor);
  const lastNounId = useAppSelector(state => state.onDisplayAuction.lastAuctionNounId);
  
  useEffect(() => {

    const loadCollections = async () => {
    	
	  const collections: ComposableItemCollection[] = await getComposableItemCollections(true, true);
	  if (collections === undefined) {
	  	return false;
	  }
	  
	  setCollections(collections.filter(collection => collection.itemCount > 0).reverse().slice(0, 10));

	  const collectionInfos = await getCollectionInfoBatch(0);
	  setCollectionInfos(collectionInfos);
	  
	  const countCollections: number = await getCountComposableItemCollections();
	  const countCollectionItems = await getCountComposableItems();
	  const sumMarketListingsFilled = await getSumMarketListingsFilled();
	  
	  const allCountCollections = countCollections && (parseInt(countCollections.toString()) + 1);
	  const allCountCollectionItems = countCollectionItems && lastNounId && (parseInt(countCollectionItems.toString()) + 1 + lastNounId);
	  const allFilled = ethBalance && ethBalance.add(sumMarketListingsFilled.toString());

	  setCountCollections(allCountCollections);
	  setCountCollectionItems(allCountCollectionItems);
	  setSumMarketListingsFilled(allFilled);
    };
    
    if (initLoad && ethBalance) {
    	loadCollections();
    	setInitLoad(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initLoad, ethBalance]);

  useEffect(() => {

    if (collections) {

	    const loadCollectionItems = async () => {
	    	
	    	const items = await getComposableItemsBatch(collections);
			setCollectionItems(items);

			const listings: ComposablesMarketListing[] = await getComposablesMarketListings();
			setListings(listings);
	    };
	    
	    loadCollectionItems();
    }    

  }, [collections]);
	
  return (
  	<>
  	
    <Section fullWidth={false} className={classes.bannerSection}>
		<Row>
	    	<Col lg={12} style={{textAlign: 'center'}}>
	        	<span className={classes.sectionHeader}>Market</span>
	        </Col>
	    	<Col lg={12}>
	    		<Row className={classes.bannerRow}>	
			    	<Col className={classes.bannerItems}>
			    		<h4>Collections</h4>
			    		<h2>{countCollections}</h2>	    		
			    	</Col>
			    	<Col className={classes.bannerItems}>
			    		<h4>Items</h4>
			    		<h2>{countCollectionItems}</h2>
			    	</Col>
			    	<Col className={classes.bannerItems} style={{display: 'none', visibility: 'hidden'}}>
			    		<h4>Sales</h4>
			    		{sumMarketListingsFilled && (
							<h2><TruncatedAmount amount={sumMarketListingsFilled.toString()} /></h2>			    			
			    		)}
			    	</Col>
			    </Row>
		    </Col>
		</Row>
    </Section>
    
    <Section fullWidth={false} className={classes.bannerSection}>
		<Row>
	    	<Col lg={12} style={{textAlign: 'center', marginTop: '5px'}}>
	        	<span className={classes.sectionHeader}>Featured Collections</span>
	        </Col>
	    	<Col lg={12}>

	          	<ComposableItemCollectionRows collections={collections} collectionItems={collectionItems} listings={listings} collectionInfos={collectionInfos} />

	          	<span className={classes.sectionFooter}>
	          		<Link text={"View All →"} url="/collections" leavesPage={false} />
	          	</span>

			</Col>
		</Row>
	</Section>    
    </>
  );
};

export default Banner;
