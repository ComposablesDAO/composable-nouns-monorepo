import classes from './ComposableItemCollectionRow.module.css';
import { Row, Col, Button, Card } from 'react-bootstrap';

import { ComposableItemCards } from '../ComposableItemCard';

import { ComposableItemCollection, ComposableItem } from '../../utils/composables/composablesWrapper';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';

export interface CollectionItems {
  tokenAddress: string;
  items: ComposableItem[];
}

export const ComposableItemCollectionRows: React.FC<{collections: ComposableItemCollection[], collectionItems?: CollectionItems[] }> = props => {
  const { collections, collectionItems } = props;

  return (
    <Row className={classes.collectionRows}>
    	{collections && (
			collections.map(collection => (
		        <Row className={classes.collectionRow}>
		          <ComposableItemCollectionRow collection={collection} composableItems={collectionItems!.find(arr => (arr.tokenAddress === collection.tokenAddress))?.items} />
		        </Row>
			))
        )}
    </Row>
  );
};


export const ComposableItemCollectionRow: React.FC<{
  collection: ComposableItemCollection;
  composableItems?: ComposableItem[]
}> = props => {
  const { collection, composableItems } = props;
  
  const collectionAddress = collection.tokenAddress;  

  if (!collection) {
  	return <></>;
  }
  
  
  const handle = undefined;
  const name = collection.name;
  const creatorName = collection.owner;

  return (
    <>
      <Col xs={6} md={6} lg={6} className={classes.collectionRowInfo}>
	      <Card.Title className={classes.cardTitle}>
	        {handle && (
	          <a href={`https://twitter.com/${handle}`} target="_blank" rel="noreferrer">
	            <svg
	              fill="currentColor"
	              viewBox="0 0 20 20"
	              aria-hidden="true"
	              className={classes.twitterIcon}
	              data-v-6cab4e66=""
	            >
	              <path
	                d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84"
	                data-v-6cab4e66=""
	              ></path>
	            </svg>
	            {name}
	          </a>
	        )}
	
	        {!handle && name}
	      </Card.Title>
	      <Card.Text style={{ paddingTop: '0rem' }}>
	      	<span style={{ color: 'gray' }}><FontAwesomeIcon icon={faUser} /> {creatorName}</span>
	      	<br />
	      </Card.Text>
		  <a href={`/collection/${collectionAddress}`}>
	      	<Button className={classes.primaryBtnCollection}>View</Button>
	      </a>      
      </Col>
      <Col xs={6} md={6} lg={6} className={classes.collectionRowItems}>
      	<strong>Latest Items:</strong>
      	<Row>
      		{composableItems && (
				<ComposableItemCards composableItems={composableItems} onlyThumbnail={true} />		        
	        )}
        </Row>
      </Col>	      
    </>
  );
};

