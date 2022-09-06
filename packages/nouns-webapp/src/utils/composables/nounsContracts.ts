import config from '../../config';
import { Contract, providers } from 'ethers';
import { NounsTokenABI } from '@nouns/contracts';
import { INounSeed } from '../../wrappers/nounToken';

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