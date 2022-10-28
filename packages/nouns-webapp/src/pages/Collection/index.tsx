//import React from 'react';
import React, { ChangeEvent, useEffect, useRef, useState, useCallback } from 'react';
import classes from './Collection.module.css';
import {
  Container,
  Col,
  Button,
  Image,
  Row,
  Form,
  OverlayTrigger,
  Popover,
  Spinner
} from 'react-bootstrap';

import { PNGCollectionEncoder } from '@nouns/sdk';

import { ComposableItemCollection, getComposableItemCollection, 
	ComposableEncodedImage, ComposableItem, getComposableItems,
	ComposablesMarketListing, getComposablesMarketListings,
	filterComposableItemMarketListing } from '../../utils/composables/composablesWrapper';	
import BigNumber from 'bignumber.js';

import { dataToDescriptorInput } from '../../utils/composables/nounsContracts';

import InfoIcon from '../../assets/icons/Info.svg';
import { PNG } from 'pngjs';

import { useAppSelector, useAppDispatch } from '../../hooks';
import { AlertModal, setAlertModal } from '../../state/slices/application';
import { Trans } from '@lingui/macro';

import { useContractFunction } from '@usedapp/core';
import { ethers, Contract, utils } from 'ethers';
import ComposableItemABI from '../../libs/abi/ComposableItem.json';

import { ComposableItemCard, ComposableItemCards } from '../../components/ComposableItemCard';

import ListingForm from './ListingForm';

const composableItemABI = new utils.Interface(ComposableItemABI);

interface PendingCustomTrait {
  type: string;
  data: string;
  palette: string[];
  filename: string;
}

const DEFAULT_TRAIT_TYPE = 'items';

interface CollectionPageProps {
  collectionAddress?: string;
  tokenId?: number;
}

const CollectionPage: React.FC<CollectionPageProps> = props => {

  const { collectionAddress } = props;  

  const [toggleLoad, setToggleLoad] = useState<boolean>(true);
  const [collection, setCollection] = useState<ComposableItemCollection | undefined>(undefined);
  const [collectionItems, setCollectionItems] = useState<ComposableItem[] | undefined>(undefined);
  const [listings, setListings] = useState<ComposablesMarketListing[]>();

  const [pendingCollectionItems, setPendingCollectionItems] = useState<ComposableItem[]>([]);
        
  const [pendingTrait, setPendingTrait] = useState<PendingCustomTrait>();
  const [isPendingTraitValid, setPendingTraitValid] = useState<boolean>();
  const customTraitFileRef = useRef<HTMLInputElement>(null);

  const [displayListingForm, setDisplayListingForm] = useState<boolean>(false);
  const [selectedItems, setSelectedItems] = useState<ComposableItem[]>([]);
  const [selectedListing, setSelectedListing] = useState<ComposablesMarketListing>();

  const [formInputs, setFormInputs] = useState<Record<string, string>>({});
  
  const [saveButtonContent, setSaveButtonContent] = useState({ loading: false, content: <>Save On-Chain</>});

  const activeAccount = useAppSelector(state => state.account.activeAccount);

  const dispatch = useAppDispatch();
  const setModal = useCallback((modal: AlertModal) => dispatch(setAlertModal(modal)), [dispatch]);  
  
  var encoder = new PNGCollectionEncoder([]);

  const composableItemContract = new Contract(
  	collectionAddress!,
	composableItemABI
  );	  	

  const { send: addItems, state: addItemsState } = useContractFunction(
    composableItemContract,
    'addItems',
  );  

  useEffect(() => {    
    switch (addItemsState.status) {      
      case 'None':
      	setSaveButtonContent({ loading: false, content: <>Save On-Chain</> });
        break;
      case 'PendingSignature':
      	setSaveButtonContent({ loading: true, content: <></> });
        break;
      case 'Mining':
      	setSaveButtonContent({ loading: true, content: <></> });
        break;
      case 'Success':
      	console.log('success', addItemsState.receipt);
      	//clear out the pending items      	
      	setPendingCollectionItems([]);
      	setFormInputs({});
      	//re-fetch the collection data
      	setCollectionItems(undefined);
	    setToggleLoad(!toggleLoad);

      	setModal({
	    	title: <>Success</>,
	    	message: <>Items successfully saved on-chain!</>,
	    	show: true,
	  	});
      	setSaveButtonContent({ loading: false, content: <>Save On-Chain</> });
      	
        break;
      case 'Fail':
      	setModal({
	    	title: <>Transaction Failed</>,
	    	message: addItemsState?.errorMessage || <>Please try again.</>,
	    	show: true,
	  	});

      	setSaveButtonContent({ loading: false, content: <>Save On-Chain</> });
        break;
      case 'Exception':
      	setModal({
	    	title: <>Transaction Error</>,
	    	message: addItemsState?.errorMessage || <>Please try again.</>,
	    	show: true,
	  	});

      	setSaveButtonContent({ loading: false, content: <>Save On-Chain</> });
        break;
    }    
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addItemsState]);
  
  useEffect(() => {

    if (collectionAddress) {

	    const loadCollectionInfo = async () => {
	    	
	    	const collection = await getComposableItemCollection(collectionAddress);
	    	setCollection(collection);
	    };
	    
	    loadCollectionInfo();	    
    }    

  }, [collectionAddress]);

  useEffect(() => {

    if (collection) {

	    const loadCollectionItems = async () => {

	    	const collectionItems = await getComposableItems(collection.tokenAddress, collection.itemCount, collection.name);
      		const listings: ComposablesMarketListing[] = await getComposablesMarketListings();

	    	setCollectionItems(collectionItems);
	    	setListings(listings);
	    };
	    
	    loadCollectionItems();
    }    

  }, [collection, toggleLoad]);  

  const resetTraitFileUpload = () => {
    if (customTraitFileRef.current) {
      customTraitFileRef.current.value = '';
    }
  };

  let pendingTraitErrorTimeout: NodeJS.Timeout;
  const setPendingTraitInvalid = () => {
    setPendingTraitValid(false);
    resetTraitFileUpload();
    pendingTraitErrorTimeout = setTimeout(() => {
      setPendingTraitValid(undefined);
    }, 5_000);
  };

  const validateAndSetCustomTrait = (file: File | undefined) => {
    if (pendingTraitErrorTimeout) {
      clearTimeout(pendingTraitErrorTimeout);
    }
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const buffer = Buffer.from(e?.target?.result!);
        const png = PNG.sync.read(buffer);
        if (png.width !== 32 || png.height !== 32) {
          throw new Error('Image must be 32x32');
        }
        const filename = file.name?.replace('.png', '') || 'custom';

        //get the current collection palette from on-chain data
        let palette = (collectionItems && collectionItems.length > 0) ? collectionItems[0].image.palette : [];
        if (palette && palette[0] === '000000') {
        	palette[0] = ''; //transparent 0-index spacer
        }
        
        if (pendingCollectionItems && pendingCollectionItems.length > 0) {
        	//grab the latest cumulative palette to build upon
        	palette = pendingCollectionItems[pendingCollectionItems.length - 1].image.palette;
        }
        
        encoder = new PNGCollectionEncoder(palette);
        const data = encoder.encodeImage(filename, {
          width: png.width,
          height: png.height,
          rgbaAt: (x: number, y: number) => {
            const idx = (png.width * y + x) << 2;
            const [r, g, b, a] = [
              png.data[idx],
              png.data[idx + 1],
              png.data[idx + 2],
              png.data[idx + 3],
            ];
            return {
              r,
              g,
              b,
              a,
            };
          },
        });
        
        setPendingTrait({
          data,
          palette: encoder.data.palette,
          filename,
          type: DEFAULT_TRAIT_TYPE,
        });
        setPendingTraitValid(true);
      } catch (error) {
      	console.log('error', error);
        setPendingTraitInvalid();
      }
    };
    reader.readAsArrayBuffer(file);
  };
     
  const uploadCustomTrait = async () => {
    const { type, data, palette, filename } = pendingTrait || {};
    if (type && data && palette && filename) {
	  
      const image: ComposableEncodedImage = {filename: filename, data: data, palette: palette};
      const meta = JSON.parse("{}");
      meta.name = filename;
	  const item: ComposableItem = { meta: meta, image: image, collection: 'None', tokenAddress: filename, tokenId: new BigNumber(0) };
	  pendingCollectionItems.push(item);
	  setPendingCollectionItems(pendingCollectionItems);

      resetTraitFileUpload();
      setPendingTrait(undefined);
      setPendingTraitValid(undefined);      
    }
  };
      
  const onItemButtonClick = (item: ComposableItem) => {
  	
  	const listing = filterComposableItemMarketListing(listings!, item.tokenAddress, item.tokenId);
  	if (listing) {
  		setSelectedListing(listing);
  	} else if (!selectedItems.find(selectedItem => (selectedItem === item))) {
  		setSelectedListing(undefined);		
	  	selectedItems.push(item);
	  	setSelectedItems(selectedItems);
	} else {
  		setSelectedListing(undefined);		
	}
  	
  	setDisplayListingForm(true);
  }

  const onFormInputChange = (e: any) => {
  	setFormInputs({
	    ...formInputs,
	    [e.target.id]: e.target.value
  	});
  }

  const resetForm = () => {
  	setPendingCollectionItems([]);
  	setFormInputs({});
  }
	  
  const saveForm = async () => {
  	
  	if (validateFormInputs()) {

		const metas: string[] = [];

		for (let i = 0; i < pendingCollectionItems.length; i++) {
			const itemName = formInputs['txtName' + i.toString()];
			const creatorName = formInputs['txtCreator' + i.toString()];
			const categoryName = formInputs['selCategory' + i.toString()];
	  		const meta = `"name":"${itemName}", "description":"${itemName} ${categoryName}", "attributes": [{"trait_type": "Category", "value": "${categoryName}"}, {"trait_type": "Creator", "value": "${creatorName}"}]`;
	  		metas.push(meta);
		}

    	const imagesPage = dataToDescriptorInput(pendingCollectionItems.map(({ image }) => image.data));
    	const metaPage = dataToDescriptorInput(metas.map((meta) => ethers.utils.hexlify(ethers.utils.toUtf8Bytes(meta))));  		
		
		const palette = pendingCollectionItems[pendingCollectionItems.length - 1].image.palette;
	  	const paletteString: string = `0x000000${palette.join('')}`; //add the transparent 0-index spacer

	  	addItems(imagesPage.encodedCompressed, imagesPage.originalLength, imagesPage.itemCount,
	  	metaPage.encodedCompressed, metaPage.originalLength, metaPage.itemCount,
	  	0, paletteString);  		
  	}
  }

  const validateFormInputs = (): boolean => {
  	let isValid: boolean = true;

	for (let i = 0; i < pendingCollectionItems.length; i++) {
		if (!formInputs['txtName' + i.toString()] || !formInputs['txtName' + i.toString()] || !formInputs['txtName' + i.toString()].trim()) {
      		isValid = false;
    	}

		if (!formInputs['txtCreator' + i.toString()] || !formInputs['txtCreator' + i.toString()] || !formInputs['txtCreator' + i.toString()].trim()) {
      		isValid = false;
    	}

		if (!formInputs['selCategory' + i.toString()] || !formInputs['selCategory' + i.toString()] || !formInputs['selCategory' + i.toString()].trim()) {
      		isValid = false;
    	}
  	}  	
  	
  	return isValid;
  };

  const isOwner = (activeAccount && collection && activeAccount.toLowerCase() === collection.owner.toLowerCase());

  const categories: string[] = ['Background', 'Body', 'Accessory', 'Head', 'Glasses', 'Flag', 'Pet', 'Wearable'];

  const saveEnabled = validateFormInputs();

  const isDisabled = addItemsState.status === 'Mining' || !activeAccount;

  return (
  	<>
      {displayListingForm && selectedItems && (
        <ListingForm
          composableItems={selectedItems}
          listing={selectedListing}
          onComplete={(action: number | undefined) => {

	        if (action === 1) {
          		setSelectedItems([]);

				setCollectionItems(undefined);
          		setToggleLoad(!toggleLoad);
	        }

	        if (action === -1) {
          		setSelectedItems([]);
	        }
          	
            setDisplayListingForm(false);
          }}
        />
      )}  	
      <Container fluid="lg">
        <Row>
          <Col lg={12} className={classes.headerRow}>
            <span>
              <Trans>Explore Collection</Trans>
            </span>
            {collection && (
            	<>
	            <h1>
	              {collection.name} ({collection.symbol}) - {collection.itemCount} item(s)
	            </h1>
	            <p>
					Explore this collection from {collection.owner}
	            </p>
	            </>
            )}
          </Col>
        </Row>
		{!collection ? (
			<div className={classes.spinner}>
				<Spinner animation="border" />
			</div>
		) : (
			<>
	        <Row>
	          <Col lg={12}>
	            <Row>
			        <Row style={{ marginBottom: '0rem' }}>
			        	{collectionItems === undefined ? (
							<div className={classes.spinner}>
								<Spinner animation="border" />
							</div>
						) : (
							<ComposableItemCards composableItems={collectionItems} listings={listings} buttonType='Listing' onButtonClick={onItemButtonClick} />							
						)}
			        </Row>
	            </Row>
	          </Col>
	        </Row>
			<Row className="composer-uploader">
	        {isOwner && (
	        	<>
	        	<Row>
	          	  <Col lg={12}>					
					<hr style={{ marginBottom: 0 }} />
					<br />
					<span style={{ fontWeight: 'bold' }}>Add new items to your collection:</span>
					<br />
					You can upload custom traits to be minted on-chain. You'll be able to give them a name, assign a category, and list them for sale on the marketplace.					
	          	  </Col>
	
	          	  <Col lg={3}>
	
		            <label style={{ margin: '1rem 0 .25rem 0' }} htmlFor="custom-trait-upload">
		              <Trans>Upload Custom Trait</Trans>
		              <OverlayTrigger
		                trigger={["hover", "hover"]}
		                placement="top"
		                overlay={
		                  <Popover>
		                    <div style={{ padding: '0.25rem' }}>
		                      <Trans>Only 32x32 PNG images are accepted</Trans>
		                    </div>
		                  </Popover>
		                }
		              >
		                <Image
		                  style={{ margin: '0 0 .25rem .25rem' }}
		                  src={InfoIcon}
		                  className={classes.voteIcon}
		                />
		              </OverlayTrigger>
		            </label>
		            <Form.Control
		              type="file"
		              id="custom-trait-upload"
		              accept="image/PNG"
		              isValid={isPendingTraitValid}
		              isInvalid={isPendingTraitValid === false}
		              ref={customTraitFileRef}
		              className={classes.fileUpload}
		              onChange={(e: ChangeEvent<HTMLInputElement>) =>
		                validateAndSetCustomTrait(e.target.files?.[0])
		              }
		            />
		            {pendingTrait && (
		              <>
		              	<br />
		                <Button onClick={() => uploadCustomTrait()} className={classes.primaryBtnUploader}>
		                  <Trans>Upload</Trans>
		                </Button>
		              </>
		            )}
					<br />
	          	  </Col>
	          	  <Col lg={9}>
	
		            <p style={{  }}>
		            </p>
	
				  </Col>          	  
				</Row>
				
				{pendingCollectionItems && pendingCollectionItems.length > 0 && (
	        	<Row style={{textAlign: 'center', justifyContent: 'center'}}>
					{pendingCollectionItems.map((item, index) => (
				      	<Row className={classes.itemRow}>
					        <Col xs={2} md={2} lg={2} className={classes.itemGroup}>
					          <ComposableItemCard composableItem={item} 
					          onlyThumbnail={true} />
					        </Col>
					        <Col xs={10} md={10} lg={10} className={classes.itemGroup} style={{paddingTop: '10px', textAlign: 'center'}}>
	
								<Row>
									<Col xs={4} lg={4} className={classes.formSection}>
										<Form.Label htmlFor={"txtName" + index} style={{ fontWeight: 'bold'}}>Name</Form.Label>
										<Form.Control 
										id={"txtName" + index}
										type="text" 
										required
										placeholder="Name" 
										maxLength={32} 
										style={{ maxWidth: '300px' }} 
										onChange={onFormInputChange}
										/>
									</Col>
									<Col xs={4} lg={4} className={classes.formSection}>
										<Form.Label htmlFor={"txtCreator" + index} style={{ fontWeight: 'bold'}}>Creator</Form.Label>
										<Form.Control 
										id={"txtCreator" + index}
										type="text" 
										required
										placeholder="Creator" 
										maxLength={32} 
										style={{ maxWidth: '300px' }} 
										onChange={onFormInputChange}
										/>
									</Col>
									<Col xs={4} lg={4} className={classes.formSection}>
										<Form.Label htmlFor={"selCategory" + index} style={{ fontWeight: 'bold'}}>Category</Form.Label>
										<Form.Select
										id={"selCategory" + index}
										required
										onChange={onFormInputChange}
										>
									        <option key='' value=''>
									          Select
									        </option>										
	
										{categories.map(value => (
									        <option key={value} value={value}>
									          {value}
									        </option>										
											)
										)}      
				                        </Form.Select>
									</Col>			
								</Row>
	
					        </Col>
						</Row>
			      	))}
		            <Button className={classes.primaryBtnUploader} onClick={() => saveForm()} disabled={!saveEnabled || isDisabled}>
		              {saveButtonContent.loading ? <Spinner animation="border" size="sm" /> : saveButtonContent.content}
		            </Button>
		            &nbsp;
		            <Button className={classes.primaryBtnUploader} onClick={() => resetForm()} disabled={isDisabled}>
		              Reset
		            </Button>
				</Row>				
				)}
			</>
					
			)}		
			</Row>
			</>
		)}
      </Container>
  	</>
  );
};

export default CollectionPage;
