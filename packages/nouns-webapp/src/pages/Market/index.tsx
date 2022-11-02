//import React from 'react';
import React, { useEffect, useState } from 'react';
import classes from './Market.module.css';
import {
  Container,
  Col,
  Button,
  Row,
  FloatingLabel,
  Form,
  Spinner
} from 'react-bootstrap';
import { Trans } from '@lingui/macro';
//import { useAppSelector } from '../../hooks';
	
import { ComposableItemCollection, getComposableItemCollections, 
	ComposablesMarketListing, getComposablesMarketListings,
	filterComposableItemMarketListing,
	ComposableItem, getComposableItemsBatch } from '../../utils/composables/composablesWrapper';
import { ComposableItemCards } from '../../components/ComposableItemCard';

interface Filter {
  title: string;
  filterNames: string[];
}

const MarketPage = () => {
    
  const [filters, setFilters] = useState<Filter[]>();
  const [initLoad, setInitLoad] = useState<boolean>(true);
  const [selectIndexes, setSelectIndexes] = useState<Record<string, number>>({});
  const [collections, setCollections] = useState<ComposableItemCollection[] | undefined>(undefined);
  const [collectionItems, setCollectionItems] = useState<ComposableItem[] | undefined>(undefined);
  const [listings, setListings] = useState<ComposablesMarketListing[]>([]);
  
  //const activeAccount = useAppSelector(state => state.account.activeAccount);
    
  useEffect(() => {

    const loadCollections = async () => {

	  const collections: ComposableItemCollection[] = await getComposableItemCollections(true);
	  if (collections === undefined) {
	  	setCollections([]);
	  } else {
		setCollections(collections);
	  }
    };
    
    if (initLoad) {
    	loadCollections();
    	setInitLoad(false);
    	
    	setFilters([
		  	{title: 'Status', filterNames: []},
	    	{title: 'Collection', filterNames: []}, 
	    	{title: 'Creator', filterNames: []}, 
	    	{title: 'Category', filterNames: []}
		]);

    }
  }, [initLoad]);
  

  useEffect(() => {

    if (collections) {

	    const loadCollectionItems = async () => {
	    	
	    	const collectionNames: string[] = [];
	    	const creatorNames: string[] = [];
			const categoryNames: string[] = [];
			    
			//all of the items from the collections
			const items = await getComposableItemsBatch(collections);
	    	
	    	for (let i = 0; i < items.length; i++) {
				
				const item = items[i];

			    if (collectionNames.indexOf(item.collection) === -1) {
			        collectionNames.push(item.collection)
			    }
				
			    if (creatorNames.indexOf(item.meta.attributes[1].value) === -1) {
			        creatorNames.push(item.meta.attributes[1].value)
			    }

			    if (categoryNames.indexOf(item.meta.attributes[0].value) === -1) {
			        categoryNames.push(item.meta.attributes[0].value)
			    }	    		
	    	}

			setCollectionItems(items);	    	

		    setFilters([
		    	{title: 'Status', filterNames: ['Listed Sale']}, 
		    	{title: 'Collection', filterNames: collectionNames}, 
		    	{title: 'Creator', filterNames: creatorNames}, 
		    	{title: 'Category', filterNames: categoryNames}
		    ]);
		    
		    const listings: ComposablesMarketListing[] = await getComposablesMarketListings();
		    setListings(listings);
	    };
	    
	    loadCollectionItems();
    }    

  }, [collections]);    

  const filterOptions = (filter: Filter) => {
    return Array.from(Array(filter.filterNames.length + 1)).map((_, index) => {
      const filterName = filter.filterNames[index - 1];
      const parsedTitle = index === 0 ? `Any` : filterName;
      return (
        <option key={index} value={filterName}>
          {parsedTitle}
        </option>
      );
    });
  };

  const filterButtonHandler = (filter: Filter, filterIndex: number) => {
  };

  var encodedItems = collectionItems;
  
  if (encodedItems && filters) {
	  const selectedListedOnSale = filters[0].filterNames[selectIndexes?.['Status']] ?? undefined;
	  const selectedCollection = filters[1].filterNames[selectIndexes?.['Collection']] ?? undefined;
	  const selectedCreator = filters[2].filterNames[selectIndexes?.['Creator']] ?? undefined;
	  const selectedCategory = filters[3].filterNames[selectIndexes?.['Category']] ?? undefined;
	  	  

	  if (selectedListedOnSale !== undefined) {
	  	encodedItems = encodedItems.filter(encodedItem => filterComposableItemMarketListing(listings, encodedItem.tokenAddress, encodedItem.tokenId));
	  }

	  if (selectedCollection !== undefined) {
	  	encodedItems = encodedItems.filter(encodedItem => encodedItem.collection === selectedCollection);
	  }

	  if (selectedCreator !== undefined) {
	  	encodedItems = encodedItems.filter(encodedItem => encodedItem.meta.creator === selectedCreator);
	  }
	  
	  if (selectedCategory !== undefined) {
	  	encodedItems = encodedItems.filter(encodedItem => encodedItem.meta.category === selectedCategory);
	  }
  }

  //encodedItems = encodedItems.filter(encodedItem => getListings(encodedItem.tokenAddress, encodedItem.tokenId).length > 0);
  //encodedItems = encodedItems.filter(encodedItem => getListing(encodedItem.tokenAddress, encodedItem.tokenId));  
  //parts.sort((a, b) => a.filename > b.filename ? -1 : 1)
  
  return (
      <Container fluid="lg">
        <Row>
          <Col lg={12} className={classes.headerRow}>
            <span>
              <Trans>Browse</Trans>
            </span>
            <h1>
              <Trans>Marketplace</Trans>
            </h1>
            <p>
                Browse the Composables marketplace, 
                where you can find items created by artists and creators from the Nouns community.
                If you're an artist, you'll soon be able to upload and sell your traits in a permissionless fashion!
            </p>
          </Col>
        </Row>
        <Row>
          <Col lg={3}>
            <Col lg={12}>
              <Button href="/collections" className={classes.primaryBtnSearch}>View Collections</Button>
            </Col>
            <Row>
              {filters &&
                filters.map((filter, index) => {
                  return (
                    <Col lg={12} xs={6}>
                      <Form className={classes.traitForm}>
                        <FloatingLabel
                          controlId="floatingSelect"
                          label={filter.title}
                          key={index}
                          className={classes.floatingLabel}
                        >
                          <Form.Select
                            aria-label="Floating label select example"
                            className={classes.traitFormBtn}
                            value={filter.filterNames[selectIndexes?.[filter.title]] ?? -1}
                            onChange={e => {
                              let index = e.currentTarget.selectedIndex;
                              filterButtonHandler(filter, index - 1); // - 1 to account for 'any'
                              setSelectIndexes({
                                ...selectIndexes,
                                [filter.title]: index - 1,
                              });
                            }}
                          >
                            {filterOptions(filter)}
                          </Form.Select>
                        </FloatingLabel>
                      </Form>
                    </Col>
                  );
                })}
            </Row>            
          </Col>
          <Col lg={9}>
            <Row>
		        <Row style={{ marginBottom: '0rem' }}>
		        	{encodedItems === undefined ? (
						<div className={classes.spinner}>
							<Spinner animation="border" />
						</div>
					) : (
						<ComposableItemCards composableItems={encodedItems} listings={listings} />							
					)}		        
		        </Row>
            </Row>
          </Col>
        </Row>
      </Container>
  );
};

export default MarketPage;
