//import React from 'react';
import React, { useEffect, useState, useRef } from 'react';
import classes from './Market.module.css';
import {
  Container,
  Col,
  Button,
  Row,
  FloatingLabel,
  Form,
  InputGroup,
  Spinner
} from 'react-bootstrap';
import Link from '../../components/Link';
import Pagination from '../../components/Pagination';
import { Trans } from '@lingui/macro';
	
import { ComposableItemCollection, getComposableItemCollections, 
	ComposablesMarketListing, getComposablesMarketListings,
	ComposableItem, getComposableItemsBatch, getComposableItemsSearch, getComposableItemsSearchCount } from '../../utils/composables/composablesWrapper';

import { isIndexerEnabled, indexComposableItemsSearchFilters, getComposableItemsSearchFilters } from '../../utils/composables/composablesIndexer';
import { ComposableItemCards } from '../../components/ComposableItemCard';

interface Filter {
  title: string;
  filterNames: string[];
}

const PageSize = 40;

const MarketPage = () => {
    
  const [filters, setFilters] = useState<Filter[]>();
  const [initLoad, setInitLoad] = useState<boolean>(true);
  const [searchToggle, setSearchToggle] = useState<boolean>(true);
  const [selectIndexes, setSelectIndexes] = useState<Record<string, number>>({});
  const [collections, setCollections] = useState<ComposableItemCollection[] | undefined>(undefined);
  const [collectionItems, setCollectionItems] = useState<ComposableItem[] | undefined>(undefined);
  const [collectionItemsCount, setCollectionItemsCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [listings, setListings] = useState<ComposablesMarketListing[]>([]);
    
  const searchInputRef = useRef<HTMLInputElement>(null);
  
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
	    	{title: 'Category', filterNames: []},
	    	{title: 'Collection', filterNames: []}, 
	    	{title: 'Creator', filterNames: []} 
		  	//{title: 'Status', filterNames: []}
		]);

    }
  }, [initLoad]);
  

  useEffect(() => {

    if (collections) {

	    const loadCollectionItems = async () => {
	    	
	    	const collectionNames: string[] = [];
	    	const creatorNames: string[] = [];
			const categoryNames: string[] = [];
			
			
			if (isIndexerEnabled()) {
				//run the indexer, this should be offloaded to an async process...
				await indexComposableItemsSearchFilters();
				//all of the items from the collections
				const rows: Record<string, any>[] = await getComposableItemsSearchFilters();
		    	
				for (let i = 0; i < rows.length; i++) {
					const row: Record<string, any> = rows[i];
						
				    if (collectionNames.indexOf(row.collectionName) === -1) {
				        collectionNames.push(row.collectionName)
				    }

				    if (categoryNames.indexOf(row.parsedCategoryName) === -1) {
				        categoryNames.push(row.parsedCategoryName)
				    }

				    if (creatorNames.indexOf(row.parsedCreatorName) === -1) {
				        creatorNames.push(row.parsedCreatorName)
				    }	
		    	}
	
				const itemsCount = await getComposableItemsSearchCount(undefined, undefined, undefined, undefined);
				const items = await getComposableItemsSearch(0, PageSize, undefined, undefined, undefined, undefined);

				setCollectionItemsCount(itemsCount);
				setCollectionItems(items);
			} else {
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
			}

		    setFilters([
		    	{title: 'Category', filterNames: categoryNames.sort((a, b) => a.toLowerCase() > b.toLowerCase() ? 1 : -1)},
		    	{title: 'Collection', filterNames: collectionNames.sort((a, b) => a.toLowerCase() > b.toLowerCase() ? 1 : -1)}, 
		    	{title: 'Creator', filterNames: creatorNames.sort((a, b) => a.toLowerCase() > b.toLowerCase() ? 1 : -1)}
		    	//{title: 'Status', filterNames: ['Listed Sale']}
		    ]);
		    
		    const listings: ComposablesMarketListing[] = await getComposablesMarketListings();
		    setListings(listings);
	    };
	    
	    loadCollectionItems();
    }    

  }, [collections]);    

  useEffect(() => {

    if (collections && filters) {

	    const loadCollectionItems = async () => {
	    	
			if (isIndexerEnabled()) {
				const selectedCategory = filters[0].filterNames[selectIndexes?.['Category']] ?? undefined;
				const selectedCollection = filters[1].filterNames[selectIndexes?.['Collection']] ?? undefined;
				const selectedCreator = filters[2].filterNames[selectIndexes?.['Creator']] ?? undefined;
				const searchText = (!searchInputRef.current || !searchInputRef.current.value || !searchInputRef.current.value.trim()) ? undefined : searchInputRef.current?.value.trim();

			    const firstPageIndex = (currentPage - 1) * PageSize;
			    const lastPageIndex = firstPageIndex + PageSize;

				const itemsCount = await getComposableItemsSearchCount(selectedCollection, selectedCategory, selectedCreator, searchText);
				const items = await getComposableItemsSearch(firstPageIndex, lastPageIndex, selectedCollection, selectedCategory, selectedCreator, searchText);

				setCollectionItemsCount(itemsCount);
				setCollectionItems(items);
			}
	    };
	    
	    loadCollectionItems();
    }

	// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchToggle, currentPage]);

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
  	setCurrentPage(1);
	setSearchToggle(!searchToggle);
  };

  const onSearchButtonClick = () => {
  	setCurrentPage(1);
	setSearchToggle(!searchToggle);
  }
	
  var encodedItems = collectionItems;
  
  if (encodedItems && filters) {
	  const selectedCategory = filters[0].filterNames[selectIndexes?.['Category']] ?? undefined;
	  const selectedCollection = filters[1].filterNames[selectIndexes?.['Collection']] ?? undefined;
	  const selectedCreator = filters[2].filterNames[selectIndexes?.['Creator']] ?? undefined;
	  //const selectedListedOnSale = filters[3].filterNames[selectIndexes?.['Status']] ?? undefined;
	  	  
	  if (selectedCollection !== undefined) {
	  	encodedItems = encodedItems.filter(encodedItem => encodedItem.collection === selectedCollection);
	  }

	  if (selectedCreator !== undefined) {
	  	encodedItems = encodedItems.filter(encodedItem => encodedItem.meta.creator === selectedCreator);
	  }
	  
	  if (selectedCategory !== undefined) {
	  	encodedItems = encodedItems.filter(encodedItem => encodedItem.meta.category === selectedCategory);
	  }
	
	  /*	  
	  if (selectedListedOnSale !== undefined) {
	  	encodedItems = encodedItems.filter(encodedItem => filterComposableItemMarketListing(listings, encodedItem.tokenAddress, encodedItem.tokenId));
	  }
	  */
	  
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
                If you're an artist, you can also upload and sell your traits in a permissionless fashion!
            </p>
          </Col>
        </Row>
        <Row>
          <Col lg={3}>
            <Col lg={12}>
      <InputGroup>
				<Form.Control 
				id="txtSearch"
				type="text" 
				placeholder="Search" 
				maxLength={100} 
				className={classes.primaryTxtSearch}
				ref={searchInputRef} 
				/>
				<Button className={classes.primaryBtnSearch} onClick={() => onSearchButtonClick()}>Search</Button>
      </InputGroup>				
								
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
                <Col lg={12} xs={6} style={{textAlign: 'center'}}>
		          	<span className={classes.searchFooter}>
		          		<Link text={"View All Collections →"} url="/collections" leavesPage={false} />
		          	</span>
	            </Col>
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
						<>

						<Pagination
					        currentPage={currentPage}
					        totalCount={collectionItemsCount}
					        pageSize={PageSize}
					        onPageChange={page => setCurrentPage(page)}
					    />
						
						<ComposableItemCards composableItems={encodedItems} listings={listings} />
						
						<Pagination
					        currentPage={currentPage}
					        totalCount={collectionItemsCount}
					        pageSize={PageSize}
					        onPageChange={page => setCurrentPage(page)}
					    />
					    </>
					)}		        
		        </Row>
            </Row>
          </Col>
        </Row>
      </Container>
  );
};

export default MarketPage;
