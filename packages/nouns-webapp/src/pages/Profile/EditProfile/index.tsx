import { Row, Col, Button, InputGroup, Form } from 'react-bootstrap';

import classes from './EditProfile.module.css';
import React, { useState, useCallback, useRef, ChangeEvent } from 'react';
import ReactDOM from 'react-dom';
import { Backdrop } from '../../../components/Modal';
import TooltipInfo from '../../../components/TooltipInfo';

import { useAppSelector, useAppDispatch } from '../../../hooks';
import { AlertModal, setAlertModal } from '../../../state/slices/application';
import { PNG } from 'pngjs';

import { insertProfileInfo, updateProfileInfo } from '../../../utils/composables/composablesIndexer';

import { useEthers } from '@usedapp/core';
import { ethers } from 'ethers';


const EditProfile: React.FC<{ walletAddress: string, profileInfo?: Record<string, any>, onComplete: (updated: boolean) => void; }> = props => {
  const { walletAddress, profileInfo, onComplete } = props;

  const { library } = useEthers();
  const activeAccount = useAppSelector(state => state.account.activeAccount);

  const dispatch = useAppDispatch();
  const setModal = useCallback((modal: AlertModal) => dispatch(setAlertModal(modal)), [dispatch]);
  
  const [thumbnailImage, setThumbnailImage] = useState<string>();
  const [bannerImage, setBannerImage] = useState<string>();

  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const thumbnailImageFileRef = useRef<HTMLInputElement>(null);
  const bannerImageFileRef = useRef<HTMLInputElement>(null);
  
  const thumbnailImageToSave = (thumbnailImage) ? thumbnailImage : (profileInfo) ? profileInfo.thumbnailImage : '';
  const bannerImageToSave = (bannerImage) ? bannerImage : (profileInfo) ? profileInfo.bannerImage : '';
  
  const saveProfile = async () => {

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
	    	message: <>Profile info was not successfully updated</>,
	    	show: true,
	  	});
  		
  		return;
  	}

	let saved = false;
  	if (profileInfo) {
		saved = await updateProfileInfo(walletAddress, description!, thumbnailImageToSave, bannerImageToSave);  		
  	} else {
		saved = await insertProfileInfo(walletAddress, description!, thumbnailImageToSave, bannerImageToSave);  		
  	}

	if (saved) {
	  	setModal({
	    	title: <>Update Successful</>,
	    	message: <>Profile info successfully updated</>,
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
  
  const description = (profileInfo) ? profileInfo.description : '';

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
          <h2>Profile Info</h2>
          Update your profile info on Composables <TooltipInfo tooltipText={"This information is stored off-chain."} />
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
						defaultValue={description}
						/>
					</Col>
					<Col xs={12} lg={12} className={classes.formSection} style={{ textAlign: 'center' }}>
						<br />
						<Button onClick={() => saveProfile()} className={classes.primaryBtn} disabled={isDisabled}>
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
export default EditProfile;
