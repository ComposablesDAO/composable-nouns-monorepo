import classes from './ComposableItemCollectionRow.module.css';
import { Row, Col, Card, Spinner } from 'react-bootstrap';

import { ComposableItemCards } from '../ComposableItemCard';

import { ComposableItemCollection, ComposableItem, ComposablesMarketListing, 
	filterComposableItemByAddress, filterCollectionInfoByAddress } from '../../utils/composables/composablesWrapper';

import ShortAddress from '../ShortAddress';
import lightGrayImage from '../../assets/light-gray.png';

const parseShortDescription = (description: string) => {
  return (description.length > 65) ? description.substr(0, 65) + "..." : description;
};

export const ComposableItemCollectionRows: React.FC<{collections: ComposableItemCollection[] | undefined, collectionItems: ComposableItem[] | undefined, listings?: ComposablesMarketListing[], collectionInfos?: Record<string, any>[] | undefined }> = props => {
  const { collections, collectionItems, listings, collectionInfos } = props;

  return (
    <Row className={classes.collectionRows}>
    	{collections === undefined ? (
			<div className={classes.spinner}>
				<Spinner animation="border" />
			</div>
        ) : (
			collections.map(collection => (
				<Col xs={12} md={6} lg={6}>
			        <Row className={classes.collectionRow}>
			          <ComposableItemCollectionRow 
			          	collection={collection} 
			          	composableItems={filterComposableItemByAddress(collectionItems, collection.tokenAddress)} 
			          	listings={listings} 
			          	collectionInfo={filterCollectionInfoByAddress(collectionInfos, collection.tokenAddress)} 
			          />
			        </Row>
			    </Col>
			))
        )}
    </Row>
  );
};


export const ComposableItemCollectionRow: React.FC<{
  collection: ComposableItemCollection;
  composableItems: ComposableItem[] | undefined,
  listings?: ComposablesMarketListing[],
  collectionInfo?: Record<string, any> | undefined
}> = props => {
  const { collection, composableItems, listings, collectionInfo } = props;
  
  const collectionAddress = collection.tokenAddress;

  if (!collection) {
  	return <></>;
  }
    
  const name = collection.name;
  const ownerAddress = collection.owner;

  const bannerImage = (collectionInfo && collectionInfo.bannerImage && collectionInfo.bannerImage !== '' ) ? `data:image/png;base64,${collectionInfo.bannerImage}` : lightGrayImage;
  const description = (collectionInfo && collectionInfo.description && collectionInfo.description !== '') ? collectionInfo.description : '';
  
  const latestItems = (composableItems) ? composableItems.slice().reverse().slice(0, 5) : composableItems;

  return (
    <>
      <Col xs={12} md={12} lg={12} className={classes.collectionRowInfo} style={{padding: 0}}>
		<a href={`/collection/${collectionAddress}`} style={{textDecoration: 'none', color: 'inherit'}}>
      	  <Card.Img variant="top" src={bannerImage} className={classes.cardImage} />
	    </a>
      </Col>
      <Col xs={12} md={12} lg={12} className={classes.collectionRowInfo}>
		<a href={`/collection/${collectionAddress}`} style={{textDecoration: 'none', color: 'inherit'}}>
	      <Card.Title className={classes.cardTitle}>
	      		{name}
	      </Card.Title>
	    </a>
	      <Card.Text style={{ paddingTop: '0rem', paddingBottom: '0rem' }}>
	      	<ShortAddress address={ownerAddress} avatar={true} link={true} />
	      	<span>{parseShortDescription(description)}</span>
	      </Card.Text>
      </Col>
      <Col xs={12} md={12} lg={12} className={classes.collectionRowItems}>
      	<strong>Latest Items:</strong>
      	<Row>
	    	{latestItems === undefined ? (
				<div className={classes.spinner}>
					<Spinner animation="border" />
				</div>
	        ) : (      	
				<ComposableItemCards composableItems={latestItems} listings={listings} onlyThumbnail={true} />
	        )}
        </Row>
      </Col>	      
    </>
  );
};

