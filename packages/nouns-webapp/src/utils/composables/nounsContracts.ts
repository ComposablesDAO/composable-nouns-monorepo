import config from '../../config';
import { ethers, Contract, providers } from 'ethers';
import { NounsTokenABI } from '@nouns/contracts';
import { INounSeed } from '../../wrappers/nounToken';

import { deflateRawSync } from 'zlib';


export interface TokenMetadata {
  name: string;
  description: string;
  image: string;
}

/**
 * Get the INounSeed data of a Noun
 * @param tokenAddress The ERC721 token address
 * @param tokenId The ERC721 token id
 * @returns The INounSeed of the Noun or undefined
 */
export async function getNounSeed(tokenAddress: string, tokenId: string): Promise<INounSeed | undefined> {

  	const jsonRpcProvider = new providers.JsonRpcProvider(config.app.jsonRpcUri);

	if (tokenAddress && tokenId) {

		const nounsTokenContract = new Contract(
			tokenAddress,
			NounsTokenABI,
			jsonRpcProvider,
	  	);

	  	const seed = await nounsTokenContract.seeds(tokenId);
		return seed;

	}
}

/**
 * Get the SVG buffer data of a Noun
 * @param tokenAddress The ERC721 token address
 * @param tokenId The ERC721 token id
 * @returns The svg buffer of the Noun or undefined
 */
export async function getNounSVGBuffer(tokenAddress: string | undefined, tokenId: string): Promise<Buffer | undefined> {

  	const jsonRpcProvider = new providers.JsonRpcProvider(config.app.jsonRpcUri);
  	
  	const nounTokenAddress = (tokenAddress) ? tokenAddress : config.addresses.nounsToken;

	if (nounTokenAddress && tokenId) {

		const nounsTokenContract = new Contract(
			nounTokenAddress,
			NounsTokenABI,
			jsonRpcProvider,
	  	);

	  	const dataURI = await nounsTokenContract.dataURI(tokenId, {gasLimit: 200_000_000});

	  	if (dataURI) {
			const data: TokenMetadata = JSON.parse(
			    Buffer.from(dataURI.substring(29), 'base64').toString('ascii'),
			);

			const svg = Buffer.from(data.image.substring(26), 'base64');
			return svg;
	  	}	
	}
}

export function dataToDescriptorInput(data: string[]): {
  encodedCompressed: string;
  originalLength: number;
  itemCount: number;
} {
  const abiEncoded = ethers.utils.defaultAbiCoder.encode(['bytes[]'], [data]);
  const encodedCompressed = `0x${deflateRawSync(
    Buffer.from(abiEncoded.substring(2), 'hex'),
  ).toString('hex')}`;

  const originalLength = abiEncoded.substring(2).length / 2;
  const itemCount = data.length;

  return {
    encodedCompressed,
    originalLength,
    itemCount,
  };
}