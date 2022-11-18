import React, { useEffect, useState } from 'react';
import classes from './Profile.module.css';
import {
  Container,
  Col,
  Button,
  Row
} from 'react-bootstrap';

import { ComposableItemCollectionRows } from '../../components/ComposableItemCollectionRow';
import CollectionForm from '../Collections/CollectionForm';
	
import { ComposableItemCollection, getComposableItemCollections, ComposableItem, getComposableItemsBatch,
	ComposablesMarketListing, getComposablesMarketListings, getCollectionInfoBatch } from '../../utils/composables/composablesWrapper';

import { getProfileInfo } from '../../utils/composables/composablesIndexer';

import { useAppSelector } from '../../hooks';

import ShortAddress from '../../components/ShortAddress';
import lightGrayImage from '../../assets/light-gray.png';

import EditProfile from './EditProfile';

import { Redirect } from 'react-router-dom';

const ProfilePage: React.FC<{ walletAddress: string }> = props => {

  const { walletAddress } = props;  

  const [initLoad, setInitLoad] = useState<boolean>(true);
  const [collections, setCollections] = useState<ComposableItemCollection[] | undefined>(undefined);
  const [collectionItems, setCollectionItems] = useState<ComposableItem[] | undefined>(undefined);
  const [listings, setListings] = useState<ComposablesMarketListing[]>();
  const [collectionInfos, setCollectionInfos] = useState<Record<string, any>[] | undefined>(undefined);
  const [toggleLoad, setToggleLoad] = useState<boolean>(true);
  const [profileInfo, setProfileInfo] = useState<Record<string, any>>();  

  const [displayEditProfile, setDisplayEditProfile] = useState<boolean>(false);
  const [displayCollectionForm, setDisplayCollectionForm] = useState<boolean>(false);
  const [redirectTokenAddress, setRedirectTokenAddress] = useState<string>();
  
  const activeAccount = useAppSelector(state => state.account.activeAccount);
  
  useEffect(() => {

    if (walletAddress) {

	    const loadProfileInfo = async () => {
	    	
	    	const profileInfo = await getProfileInfo(walletAddress);
	    	
	    	setProfileInfo(profileInfo);
	    };
	    
	    loadProfileInfo();
    }    

  }, [walletAddress, toggleLoad]);
  
  useEffect(() => {

    const loadCollections = async () => {
    	
	  const collections: ComposableItemCollection[] = await getComposableItemCollections(true);
	  if (collections === undefined) {
	  	setCollections([]);
	  } else {
	  	setCollections(collections.reverse());
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

  const isOwner = (activeAccount && walletAddress && activeAccount.toLowerCase() === walletAddress.toLowerCase());  
  const profileCollections = (collections && walletAddress) ? collections.filter(collection => collection.owner.toLowerCase() === walletAddress.toLowerCase()) : [];
  
  const bannerImage = (profileInfo && profileInfo.bannerImage && profileInfo.bannerImage !== '' ) ? `data:image/png;base64,${profileInfo.bannerImage}` : lightGrayImage;
  const thumbnailImage = (profileInfo && profileInfo.thumbnailImage && profileInfo.thumbnailImage !== '') ? `data:image/png;base64,${profileInfo.thumbnailImage}` : lightGrayImage;
  const description = (profileInfo && profileInfo.description && profileInfo.description !== '') ? profileInfo.description : '';

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
      {displayEditProfile && walletAddress && (
        <EditProfile
          walletAddress={walletAddress}
          profileInfo={profileInfo}
          onComplete={(updated: boolean) => {

	        if (updated) {
          		setToggleLoad(!toggleLoad);
	        }

            setDisplayEditProfile(false);
          }}
        />
      )}
      <Container fluid="lg">
        <Row>
          <Col lg={12} className={classes.headerBannerRow}>
          		<div className={classes.bannerRow}>
            	<img src={bannerImage} className={classes.bannerImage} alt='banner' />
            	<img src={thumbnailImage} className={classes.thumbnailImage} alt='thumbnail' />
				</div>
          </Col>
      		<Col sm={10} lg={10} className={classes.headerRow}>
	            <h1>
					<ShortAddress address={walletAddress} avatar={true} />		        
	            </h1>
	        </Col>
			<Col sm={2} lg={2} className={classes.headerRow} style={{textAlign: 'right'}}>
	        {isOwner && (
				<Button className={classes.primaryBtn} onClick={() => setDisplayEditProfile(true)}>Edit Info</Button>
	        )}
		    </Col>
	        <Col lg={12} className={classes.descriptionRow}>
				{description}
				<hr style={{ marginBottom: 0 }} />
	        </Col>
        </Row>
        <Row>
          <Col lg={6}>
          	<span style={{fontWeight: 'bold'}}>Collections:</span>
          </Col>
          <Col lg={6} style={{textAlign: 'right'}}>
	        {isOwner && (
				<Button className={classes.primaryBtn} onClick={() => setDisplayCollectionForm(true)}>New Collection</Button>
	        )}
          </Col>
        </Row>        	
        <Row>
          <Col lg={12}>
	        {profileCollections && profileCollections.length > 0 ? (
				<ComposableItemCollectionRows collections={profileCollections} collectionItems={collectionItems} listings={listings} collectionInfos={collectionInfos} />
	        ) : (
	        	<p style={{minHeight: '400px', textAlign: 'center', fontStyle: 'italic'}}>
	        		None
	        	</p>
	        )}
			<hr />
          </Col>
        </Row>
      </Container>
  	</>
  );
};

export default ProfilePage;
