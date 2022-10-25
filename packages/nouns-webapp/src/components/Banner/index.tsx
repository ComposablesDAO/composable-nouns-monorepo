import classes from './Banner.module.css';
import Section from '../../layout/Section';
import { Row, Col } from 'react-bootstrap';

import { useEffect, useState } from 'react';
import { ComposableItemCollection, getComposableItemCollections, 
	getComposableItems } from '../../utils/composables/composablesWrapper';
import { ComposableItemCollectionRows, CollectionItems } from '../../components/ComposableItemCollectionRow';
import Link from '../../components/Link';
import banner_animation from '../../assets/Composer-Banner.gif';

const Banner = () => {


  const [initLoad, setInitLoad] = useState<boolean>(true);
  const [collections, setCollections] = useState<ComposableItemCollection[]>([]);
  const [collectionItems, setCollectionItems] = useState<CollectionItems[]>([]);

  useEffect(() => {

    const loadCollections = async () => {
    	
	  const collections: ComposableItemCollection[] = await getComposableItemCollections(true);
	  if (collections === undefined) {
	  	return false;
	  }
	  
	  setCollections(collections.filter(collection => collection.itemCount > 0).reverse().slice(0, 5));	
    };
    
    if (initLoad) {
    	loadCollections();
    	setInitLoad(false);
    }	
  }, [initLoad]);

  useEffect(() => {

    if (collections) {

	    const loadCollectionItems = async () => {
	    	
			let items: CollectionItems[] = [];
	    	
	    	for (let i = 0; i < collections.length; i++) {
	    		const cItems = await getComposableItems(collections[i].tokenAddress, collections[i].itemCount, collections[i].name);
	    		
	    		items.push({tokenAddress: collections[i].tokenAddress, items: cItems });
	    	}

			setCollectionItems(items);	    			  
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
	        	<span className={classes.sectionHeader}>Latest collections:</span>

	          	<ComposableItemCollectionRows collections={collections} collectionItems={collectionItems} />

	          	<span className={classes.sectionFooter}>
	          		<Link text={"All Collections"} url="/collections" leavesPage={false} />
	          	</span>

			</Col>
		</Row>
	</Section>    
    </>
  );
};

export default Banner;
