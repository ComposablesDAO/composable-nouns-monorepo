# @nouns/contracts/composables

## Composables smart contracts

The Composables framework is intended to plug into the existing Nouns protocol and provide extensibility to Nouns.

The framework currently consists of three major components:
* Composer
* Composable Items
* Composables Market


## Composer overview

The Composer smart contract handles the different layering and composition mechanics for a Noun. It plugs into the Nouns protocol at the Descriptor layer.

The Composer implements a modified form of the [ERC-998](https://eips.ethereum.org/EIPS/eip-998) functionality, and allows for the Composer to "own" other tokens, including ERC721, ERC1155 and ERC20 tokens. It also provides a basic "composition" mechanism that allows for the token owner to arrange child tokens in specific layers for visual display purposes.

In order to add the Composer to a Nouns fork, you can simply upgrade your base Descriptor to use the Composable Descriptor, where it makes calls to the Composer contract.

A simplified diagram of the workflow is below:

![image](https://user-images.githubusercontent.com/1504119/199800958-8fe86162-2c13-4927-ad90-08696126fe3e.png)

The Composable Descriptor is a virtual copy of the Descriptor V2 contract, except for the `getPartsForSeed` function when it makes a call to the Composer contract. 

If there are no Composable Items associated to the Noun in question, it falls back to default Descriptor functionality.

## Composable Items overview

A Composable item can be any ERC721/ERC1155/ERC20 token that implements the `IComposablePart` interface. This allows for it to be arranged by the Composer contract within a Noun.

Composable items need to first be transferred into the Composer (via the `receiveChild` Composer functions) before they can be composed. There are also provided batch function to receive and compose child tokens in a single transaction.

The `ComposableItem` smart contract is an implementation of a Composable item that contains simplified forms of the Nouns Descriptor/Art/SVG Renderer/Inflator, and uses the same compression and encoding mechanism for on-chain art and for metadata configuration.

The `ComposableItemFactory` smart contract provides a cloned factory pattern for `ComposableItem` contracts and can be used to create collections cheaply.

`ComposableItem` collections are standalone NFT collections and can be viewed on any 3rd party platform such as Opensea, LooksRare or Rarible. The creator is the owner of the smart contract and can choose to take it with them wherever they please.

## Composables Market overview

The Composables Market V1 is a basic on-chain marketplace that allows for creators to list their collections for sale on the Composables website.

Creators are able to do the following:

* Create basic listings - specify listing price, total quantity, and optionally limit the max amount of mints per wallet
* Create open-editions - specify the listing and optionally limit the max amount of mints per wallet
* Create free drops - specify the total quantity and optionally limit the max amount of mints per wallet

All marketplace activities can be done either via the Composables website or directly via Etherscan as desired.
