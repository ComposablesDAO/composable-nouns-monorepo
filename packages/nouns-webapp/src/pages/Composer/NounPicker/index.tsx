import { Container, Row, Col } from 'react-bootstrap';
import classes from './NounPicker.module.css';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import Noun from '../../../components/Noun';
import { Backdrop } from '../../../components/Modal';

import { getNounSeed } from '../../../utils/composables/nounsContracts';
import { TokenItem, getChildTokens, getComposedChildBatch } from '../../../utils/composables/composablesWrapper';

import { useAppSelector } from '../../../hooks';
import { INounSeed } from '../../../wrappers/nounToken';
import axios, {AxiosResponse} from 'axios';
import config from '../../../config';

const NounPicker: React.FC<{ onSelect: (extensionName: string | undefined, tokenAddress: string | undefined, tokenId: number | undefined, seed: INounSeed | undefined, composerProxyAddress: string | undefined, childTokens: TokenItem[], composedChildTokens: TokenItem[]) => void; }> = props => {
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
	  	let composerProxyAddress = undefined;
	  	for (const extension of nounExtensions) {
		  	if (extension.tokenAddress.toLowerCase() === tokenAddress.toLowerCase()) {
		  		extensionName = extension.name;
		  		composerProxyAddress = extension.composerProxy;
		  	}
		}
		
		let childTokens: TokenItem[] = [];
		let composedChildTokens: TokenItem[] = [];
		if (composerProxyAddress) {
			childTokens = await getChildTokens(composerProxyAddress, tokenId);
			composedChildTokens = await getComposedChildBatch(composerProxyAddress, tokenId, 1, 16);
		}
		
		onSelect(extensionName, tokenAddress, tokenId, seed, composerProxyAddress, childTokens, composedChildTokens);
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
			url += "&contractAddresses[]=" + extension.tokenAddress;
		}		  		
		url += "&withMetadata=true";
				
		// Make the request and print the formatted response:
		axios.get(url)
		    .then(response => setNounNfts(response))
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
            onSelect(undefined, undefined, undefined, undefined, undefined, [], []);
          }}
        />,
        document.getElementById('backdrop-root')!,
      )}
      {ReactDOM.createPortal(
        <div className={classes.modal}>
          Select a Noun to use in the Composer:

	      <Container fluid="lg" className={classes.nounContainer}>
	        <Row>
	        
		      {activeAccount === undefined && (
		      	<p style={{textAlign: 'center', color: 'red'}}>		      	
		        Please connect your wallet first
    			</p>
		      )}	        
		      {activeAccount !== undefined && nounNfts && nounNfts.data && nounNfts.data.ownedNfts.length === 0 && (
		      	<p style={{textAlign: 'center', color: 'red'}}>		      	
		        No Nouns found in your wallet!
    			</p>
		      )}	        

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
