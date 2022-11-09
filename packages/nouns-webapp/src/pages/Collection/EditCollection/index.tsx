import { Row, Col, Button, InputGroup, Form } from 'react-bootstrap';

import classes from './EditCollection.module.css';
import React, { useState, useCallback, useRef, ChangeEvent } from 'react';
import ReactDOM from 'react-dom';
import { Backdrop } from '../../../components/Modal';
import TooltipInfo from '../../../components/TooltipInfo';

import { useAppSelector, useAppDispatch } from '../../../hooks';
import { AlertModal, setAlertModal } from '../../../state/slices/application';
import { PNG } from 'pngjs';

import { saveCollectionInfo } from '../../../utils/composables/composablesIndexer';

import { useEthers } from '@usedapp/core';
import { ethers } from 'ethers';


const EditCollection: React.FC<{ tokenAddress: string, collectionInfo: Record<string, any>, onComplete: (updated: boolean) => void; }> = props => {
  const { tokenAddress, collectionInfo, onComplete } = props;

  const { library } = useEthers();
  const activeAccount = useAppSelector(state => state.account.activeAccount);

  const dispatch = useAppDispatch();
  const setModal = useCallback((modal: AlertModal) => dispatch(setAlertModal(modal)), [dispatch]);
  
  const [thumbnailImage, setThumbnailImage] = useState<string>();
  const [bannerImage, setBannerImage] = useState<string>();

  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const thumbnailImageFileRef = useRef<HTMLInputElement>(null);
  const bannerImageFileRef = useRef<HTMLInputElement>(null);
  
  const thumbnailImageToSave = (thumbnailImage) ? thumbnailImage : collectionInfo.thumbnailImage;
  const bannerImageToSave = (bannerImage) ? bannerImage : collectionInfo.bannerImage;
  
  const saveCollectionProfile = async () => {

  	if (!activeAccount || !library) {
  		return;
  	}

  	const description = descriptionInputRef.current?.value.trim();

	const signer = library.getSigner();
	const message = "Description: " + description;
  	const signature = await signer.signMessage(message);
  	
  	const signAddress = await ethers.utils.verifyMessage(message, signature);
  	if (signAddress.toLowerCase() !== activeAccount.toLowerCase()) {

	  	setModal({
	    	title: <>Update Failed</>,
	    	message: <>Collection info was not successfully updated</>,
	    	show: true,
	  	});
  		
  		return;
  	}
  	  	
	const updated = await saveCollectionInfo(tokenAddress, description!, thumbnailImageToSave, bannerImageToSave);

	if (updated) {
	  	setModal({
	    	title: <>Update Successful</>,
	    	message: <>Collection info successfully updated</>,
	    	show: true,
	  	});
	}
	
	onComplete(true);
	/*        
  	const jsonRpcProvider = new providers.JsonRpcProvider(config.app.jsonRpcUri);
  	const nonce = await jsonRpcProvider.getTransactionCount(activeAccount!);

  	const symbol = symbolInputRef.current?.value.trim().toUpperCase();
	*/
  };  

  const validateAndSetImage = (file: File | undefined, type: string) => {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const buffer = Buffer.from(e?.target?.result!);
        const png = PNG.sync.read(buffer);
        //1500 pixels wide by 500 pixels high.
        if (png.width > 3000 || png.height > 1000) {
          throw new Error('Image must be smaller than 3,000 x 1,000');
        }
        //const filename = file.name?.replace('.png', '') || 'custom';				
		const base64 = buffer.toString('base64');

		if (type === 'thumbnail') {
			setThumbnailImage(base64);
		} else if (type === 'banner') {
			setBannerImage(base64);
		}		

      } catch (error) {
      	console.log('error', error);
        //setPendingTraitInvalid();
      }
    };
    reader.readAsArrayBuffer(file);
  };  

  const isDisabled = !activeAccount;
  
  return (
    <>
      {ReactDOM.createPortal(
        <Backdrop
          onDismiss={() => {
            onComplete(false);
          }}
        />,
        document.getElementById('backdrop-root')!,
      )}
      {ReactDOM.createPortal(
        <div className={classes.modal}>
          <h2>Collection Info</h2>
          Update your collection profile info on Composables <TooltipInfo tooltipText={"This information is stored off-chain."} />
			<br /><br />
			<InputGroup>
				<Row>
					<Col xs={12} lg={12} className={classes.formSection}>
			            {thumbnailImageToSave && (
			            	<>
			            	<img src={`data:image/png;base64,${thumbnailImageToSave}`} style={{width: '100px', height: '100px'}} alt='thumbnail' />
							<br />
							</>
			            )}
			            <label style={{ margin: '1rem 0 .25rem 0', fontWeight: 'bold' }} htmlFor="thumb-image-upload">
			              Change Thumbnail
			            </label>
			            <Form.Control
			              type="file"
			              id="thumb-image-upload"
			              accept="image/PNG"
			              ref={thumbnailImageFileRef}
			              className={classes.fileUpload}
			              onChange={(e: ChangeEvent<HTMLInputElement>) =>
			                validateAndSetImage(e.target.files?.[0], 'thumbnail')
			              }
			            />
					</Col>
					<Col xs={12} lg={12} className={classes.formSection}>
			            {bannerImageToSave && (
			            	<img src={`data:image/png;base64,${bannerImageToSave}`} style={{width: '100%'}} alt='banner' />
			            )}
			            <label style={{ margin: '1rem 0 .25rem 0', fontWeight: 'bold' }} htmlFor="banner-image-upload">
			              Change Banner
			            </label>
			            <Form.Control
			              type="file"
			              id="banner-image-upload"
			              accept="image/PNG"
			              ref={bannerImageFileRef}
			              className={classes.fileUpload}
			              onChange={(e: ChangeEvent<HTMLInputElement>) =>
			                validateAndSetImage(e.target.files?.[0], 'banner')
			              }
			            />
					</Col>
					<Col xs={12} lg={12} className={classes.formSection}>
						<Form.Label htmlFor="txtName" style={{ fontWeight: 'bold'}}>Description</Form.Label>
						<Form.Control
						as="textarea" rows={3}
						id="txtDecription"
						placeholder="Description" 
						maxLength={1000}
						ref={descriptionInputRef} 
						defaultValue={collectionInfo.description}
						/>
					</Col>
					<Col xs={12} lg={12} className={classes.formSection} style={{ textAlign: 'center' }}>
						<br />
						<Button onClick={() => saveCollectionProfile()} className={classes.primaryBtn} disabled={isDisabled}>
			              Save
			            </Button>
			            <br />
			            <span style={{fontSize: 'small'}} >
			            	You will be asked to sign a free (gassless) message with your wallet
			            </span>
			        </Col>
				</Row>			              
			</InputGroup>

        </div>,
        document.getElementById('overlay-root')!,
      )}
    </>
  );
};
export default EditCollection;
