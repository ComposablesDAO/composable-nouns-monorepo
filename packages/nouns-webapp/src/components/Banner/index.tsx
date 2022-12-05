import classes from './Banner.module.css';
import Section from '../../layout/Section';
import { Row, Col } from 'react-bootstrap';

import { useEffect, useState } from 'react';
import { ComposableItemCollection, getComposableItemCollections, 
	ComposableItem, getComposableItemsBatch, ComposablesMarketListing, getComposablesMarketListings, getCollectionInfoBatch,
	getCountComposableItemCollections, getCountComposableItems } from '../../utils/composables/composablesWrapper';
import { ComposableItemCollectionRows } from '../../components/ComposableItemCollectionRow';
import Link from '../../components/Link';

const Banner = () => {


  const [initLoad, setInitLoad] = useState<boolean>(true);
  const [collections, setCollections] = useState<ComposableItemCollection[] | undefined>(undefined);
  const [collectionItems, setCollectionItems] = useState<ComposableItem[] | undefined>(undefined);
  const [listings, setListings] = useState<ComposablesMarketListing[]>();
  const [collectionInfos, setCollectionInfos] = useState<Record<string, any>[] | undefined>(undefined);

  const [countCollections, setCountCollections] = useState<number>();
  const [countCollectionItems, setCountCollectionItems] = useState<number>();

  useEffect(() => {

    const loadCollections = async () => {
    	
	  const collections: ComposableItemCollection[] = await getComposableItemCollections(true, true);
	  if (collections === undefined) {
	  	return false;
	  }
	  
	  setCollections(collections.filter(collection => collection.itemCount > 0).reverse().slice(0, 6));	

	  const collectionInfos = await getCollectionInfoBatch(0);
	  setCollectionInfos(collectionInfos);
	  
	  const countCollections = await getCountComposableItemCollections();
	  const countCollectionItems = await getCountComposableItems();

	  setCountCollections(countCollections);
	  setCountCollectionItems(countCollectionItems);
    };
    
    if (initLoad) {
    	loadCollections();
    	setInitLoad(false);
    }	
  }, [initLoad]);

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
	    	<Col xs={6} lg={6} className={classes.bannerLeft}>
	    		<h4>Collections</h4>
	    		<h2>{countCollections}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</h2>	    		
	    	</Col>
	    	<Col xs={6} lg={6} className={classes.bannerRight}>
	    		<h4>Items</h4>
	    		<h2>{countCollectionItems}</h2>
	    	</Col>
		</Row>
    </Section>
    
    <Section fullWidth={false} className={classes.homeSection}>
		<Row>
	    	<Col lg={12} style={{textAlign: 'center'}}>
	        	<span className={classes.sectionHeader}>Featured</span>
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
