import { Container, Row, Col } from 'react-bootstrap';
import classes from './NounPicker.module.css';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import Noun from '../../../components/Noun';
import { Backdrop } from '../../../components/Modal';

import { getNounSeed } from '../../../utils/composables/nounsContracts';

import { useAppSelector } from '../../../hooks';
import { INounSeed } from '../../../wrappers/nounToken';
import axios, {AxiosResponse} from 'axios';
import config from '../../../config';

const NounPicker: React.FC<{ onSelect: (extensionName: string | undefined, seed: INounSeed | undefined) => void; }> = props => {
  const { onSelect } = props;
  const svg = '';

  const [nounNfts, setNounNfts] = useState<AxiosResponse>();

  const activeAccount = useAppSelector(state => state.account.activeAccount);
  
  const nounExtensions = config.composables.extensions;
  
  //
  const setIndexOfNounSelectedAndReturn = (index : number) => {
  	
    const loadSeed = async () => {
    	if (!nounNfts) {
    		return;
    	}
	  	const nft = nounNfts.data.ownedNfts[index];
	  	
	  	const tokenAddress = nft.contract.address;
	  	const tokenId = nft.id.tokenId;
	  	const seed = await getNounSeed(tokenAddress, tokenId);
	  	
	  	let extensionName = undefined;
	  	for (const extension of nounExtensions) {
		  	if (extension.address.toLowerCase() === tokenAddress.toLowerCase()) {
		  		extensionName = extension.name;	  		
		  	}
		}
		
		onSelect(extensionName, seed);
    };
    loadSeed();
	
  };

  useEffect(() => {
    //window.addEventListener('resize', handleWindowSizeChange);
    
    const loadNouns = async () => {
      	//setPng(await svg2png(svg, 512, 512));
		// Wallet address
		if (activeAccount === undefined) {
			return;
		}
		
		// Alchemy URL
		//config.app.jsonRpcUri
		const baseURL = config.app.nftApiUri;
		let url = `${baseURL}/getNFTs/?owner=${activeAccount}`;
		
		for (const extension of nounExtensions) {
			url += "&contractAddresses[]=" + extension.address;
		}		  		
		url += "&withMetadata=true";
				
		// Make the request and print the formatted response:
		axios.get(url)
		    .then(response => setNounNfts(response) /*console.log(response['data'])*/)
		    .catch(error => console.log('error', error));
          
    };
    loadNouns();

    return () => {
      //window.removeEventListener('resize', handleWindowSizeChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svg]);
  
  return (
    <>
      {ReactDOM.createPortal(
        <Backdrop
          onDismiss={() => {
            onSelect(undefined, undefined);
          }}
        />,
        document.getElementById('backdrop-root')!,
      )}
      {ReactDOM.createPortal(
        <div className={classes.modal}>
          Select a Noun to use in the Composer

	      <Container fluid="lg" className={classes.nounContainer}>
	        <Row>

	          {nounNfts && nounNfts.data && nounNfts.data.ownedNfts &&
	            nounNfts.data.ownedNfts.map((nft: any, i: any) => {
	              return (
	                <Col xs={4} lg={4} key={i}>
                      <div
                      	className={classes.nounOuterWrapper}
                        onClick={() => {
                          setIndexOfNounSelectedAndReturn(i);
                        }}
                      >
	                    <Noun
	                      imgPath={nft.media[0].raw}
	                      alt={nft.title}
	                      className={classes.nounImg}
	                      wrapperClassName={classes.nounWrapper}
	                    />
	                    {nft.title}
	                  </div>
	                </Col>
	              );
	            })}

	        </Row>
		  </Container>

        </div>,
        document.getElementById('overlay-root')!,
      )}
    </>
  );
};
export default NounPicker;
