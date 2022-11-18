import { useEffect, useState } from 'react';
import classes from './Collections.module.css';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Trans } from '@lingui/macro';

import { ComposableItemCollectionRows } from '../../components/ComposableItemCollectionRow';
import CollectionForm from './CollectionForm';
	
import { ComposableItemCollection, getComposableItemCollections, ComposableItem, getComposableItemsBatch,
	ComposablesMarketListing, getComposablesMarketListings, getCollectionInfoBatch } from '../../utils/composables/composablesWrapper';

import { useAppSelector } from '../../hooks';

import { Redirect } from 'react-router-dom';

const CollectionsPage = () => {
    
  const [initLoad, setInitLoad] = useState<boolean>(true);
  const [collections, setCollections] = useState<ComposableItemCollection[] | undefined>(undefined);
  const [collectionItems, setCollectionItems] = useState<ComposableItem[] | undefined>(undefined);
  const [listings, setListings] = useState<ComposablesMarketListing[]>();
  const [collectionInfos, setCollectionInfos] = useState<Record<string, any>[] | undefined>(undefined);
  const [displayCollectionForm, setDisplayCollectionForm] = useState<boolean>(false);
  
  const [redirectTokenAddress, setRedirectTokenAddress] = useState<string>();
  
  const activeAccount = useAppSelector(state => state.account.activeAccount);
  
  useEffect(() => {

    const loadCollections = async () => {
    	
	  const collections: ComposableItemCollection[] = await getComposableItemCollections(true);
	  if (collections === undefined) {
	  	setCollections([]);
	  } else {
	  	setCollections(collections.filter(collection => collection.itemCount > 0).reverse());
	  }
	  
	  const collectionInfos = await getCollectionInfoBatch(0);
	  setCollectionInfos(collectionInfos);
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
            {activeAccount && (
				<Button href={`/profile/${activeAccount}`} className={classes.primaryBtn}>My Collections</Button>
            )}
			&nbsp;&nbsp;&nbsp;
			<Button onClick={() => setDisplayCollectionForm(true)} className={classes.primaryBtn}>
              New Collection
            </Button>          

          </Col>
        </Row>
        <Row>
          <Col lg={12}>
          	<ComposableItemCollectionRows collections={collections} collectionItems={collectionItems} listings={listings} collectionInfos={collectionInfos} />
          </Col>
        </Row>
      </Container>
	</>
  );
};

export default CollectionsPage;
