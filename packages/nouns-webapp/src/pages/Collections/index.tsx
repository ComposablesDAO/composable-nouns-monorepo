import { useEffect, useState } from 'react';
import classes from './Collections.module.css';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Trans } from '@lingui/macro';

import { ComposableItemCollectionRows } from '../../components/ComposableItemCollectionRow';
import CollectionForm from './CollectionForm';
	
import { ComposableItemCollection, getComposableItemCollections, ComposableItem, getComposableItemsBatch,
	ComposablesMarketListing, getComposablesMarketListings } from '../../utils/composables/composablesWrapper';

import { useAppSelector } from '../../hooks';

import { Redirect } from 'react-router-dom';

const CollectionsPage = () => {
    
  const [initLoad, setInitLoad] = useState<boolean>(true);
  const [collections, setCollections] = useState<ComposableItemCollection[] | undefined>(undefined);
  const [collectionItems, setCollectionItems] = useState<ComposableItem[] | undefined>(undefined);
  const [listings, setListings] = useState<ComposablesMarketListing[]>();
  const [displayCollectionForm, setDisplayCollectionForm] = useState<boolean>(false);
  
  const [redirectTokenAddress, setRedirectTokenAddress] = useState<string>();
  
  const activeAccount = useAppSelector(state => state.account.activeAccount);
  
  useEffect(() => {

    const loadCollections = async () => {
    	
	  const collections: ComposableItemCollection[] = await getComposableItemCollections(true);
	  if (collections === undefined) {
	  	setCollections([]);
	  } else {
	  	setCollections(collections.reverse());
	  }

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
  
  const myCollections = (activeAccount && collections) ? collections.filter(collection => collection.owner.toLowerCase() === activeAccount.toLowerCase()) : [];
  const otherCollections = (activeAccount && collections) ? collections.filter(collection => collection.owner.toLowerCase() !== activeAccount.toLowerCase()) : collections;

  return (
  	<>
      {displayCollectionForm && (
        <CollectionForm
          onComplete={(tokenAddress: string | undefined) => {

          	//check if none selected, then just close modal          	
          	if (tokenAddress !== undefined) {
          		setRedirectTokenAddress(tokenAddress)
	        }
          	
            setDisplayCollectionForm(false);
          }}
        />
      )}
      {redirectTokenAddress && (
      	<Redirect push to={`/collection/${redirectTokenAddress}`} />  	      	
      )}
      <Container fluid="lg">
        <Row>
          <Col lg={12} className={classes.headerRow}>
            <span>
              <Trans>Explore</Trans>
            </span>
            <h1>
              <Trans>Collections</Trans>
            </h1>
            <p>
                Explore the latest collections on Composables, created by artists and builders from the Nouns community.
            </p>
			<Button onClick={() => setDisplayCollectionForm(true)} className={classes.primaryBtn}>
              New Collection
            </Button>          

          </Col>
        </Row>
        {activeAccount && myCollections && (
	        <Row>
	          <Col lg={12}>
	          	<span style={{fontWeight: 'bold'}}>My Collections:</span>
	          	<ComposableItemCollectionRows collections={myCollections} collectionItems={collectionItems} listings={listings} />
	          	<hr />
	          </Col>
	        </Row>
        	
        )}
        <Row>
          <Col lg={12}>
          	<span style={{fontWeight: 'bold'}}>All Collections:</span>
          	<ComposableItemCollectionRows collections={otherCollections} collectionItems={collectionItems} listings={listings} />
          </Col>
        </Row>
      </Container>
	</>
  );
};

export default CollectionsPage;
