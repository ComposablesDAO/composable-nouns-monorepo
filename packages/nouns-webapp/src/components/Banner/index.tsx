import classes from './Banner.module.css';
import Section from '../../layout/Section';
import { Row, Col } from 'react-bootstrap';

import { useEffect, useState } from 'react';
import { ComposableItemCollection, getComposableItemCollections, 
	ComposableItem, getComposableItemsBatch, ComposablesMarketListing, getComposablesMarketListings } from '../../utils/composables/composablesWrapper';
import { ComposableItemCollectionRows } from '../../components/ComposableItemCollectionRow';
import Link from '../../components/Link';
import banner_animation from '../../assets/Composer-Banner.gif';

const Banner = () => {


  const [initLoad, setInitLoad] = useState<boolean>(true);
  const [collections, setCollections] = useState<ComposableItemCollection[] | undefined>(undefined);
  const [collectionItems, setCollectionItems] = useState<ComposableItem[] | undefined>(undefined);
  const [listings, setListings] = useState<ComposablesMarketListing[]>();

  useEffect(() => {

    const loadCollections = async () => {
    	
	  const collections: ComposableItemCollection[] = await getComposableItemCollections(true);
	  if (collections === undefined) {
	  	return false;
	  }
	  
	  setCollections(collections.filter(collection => collection.itemCount > 0).reverse().slice(0, 3));	
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
    	<img src={banner_animation} alt='Composables' />
    </Section>
    
    <Section fullWidth={false} className={classes.homeSection}>
		<Row>
	    	<Col lg={12}>
	        	<span className={classes.sectionHeader}>Latest Collections:</span>

	          	<ComposableItemCollectionRows collections={collections} collectionItems={collectionItems} listings={listings} />

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
