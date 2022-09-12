//import React from 'react';
import React, { ReactNode, useEffect, useState } from 'react';
import classes from './Market.module.css';
import {
  Container,
  Col,
  Button,
  Row,
  FloatingLabel,
  Form,
  Card
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';

import { EncodedImage } from '@nouns/sdk';

import { ImageData } from '@nouns/assets';
import { default as ComposablesImageData } from '../../libs/image-data/image-data-composables.json';
import { buildSVG } from '../../utils/composables/nounsSDK';

import { Trans } from '@lingui/macro';

interface Trait {
  title: string;
  traitNames: string[];
}

const parseTraitName = (partName: string): string =>
  capitalizeFirstLetter(partName.substring(partName.indexOf('-') + 1));

const capitalizeFirstLetter = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

const addSpacing = (s: string): string => s.replaceAll('_', ' ').replaceAll('-', ' ');

const parseRemainderName = (partName: string): string =>
  capitalizeFirstLetter(partName.substring(partName.indexOf('-') + 1));

const parseFirstName = (partName: string): string =>
  capitalizeFirstLetter(partName.substring(0, partName.indexOf('-')));

const parseCreatorName = (partName: string): string =>
  creatorNameMapping(parseFirstName(partName));

const parseCategoryName = (partName: string): string =>
  parseFirstName(parseRemainderName(partName));

const parseItemName = (partName: string): string =>
  addSpacing(parseRemainderName(parseRemainderName(partName)));
  
const creatorNameMapping = (s: string): string => {
  const traitMap = new Map([
    ['Digi', 'DigiNouns'],
  ]);

  return traitMap.get(s) || addSpacing(s);
};


const ItemCard: React.FC<{
  filename: string;
  data: string;
}> = props => {
  const { filename, data } = props;
  
  const part = {
  	"filename": filename,
	"data": data,
  };
  const parts = [ part ];
  const svg = buildSVG(parts, ComposablesImageData.palette, 'fff');

  const handle = undefined;
  const creatorName = parseCreatorName(filename);
  const categoryName = parseCategoryName(filename);
  const itemName = parseItemName(filename);
  
  const name = itemName;

  return (
    <>
      <Card.Img variant="top" src={`data:image/svg+xml;base64,${btoa(svg)}`} />
      <Card.Title className={classes.cardTitle}>
        {handle && (
          <a href={`https://twitter.com/${handle}`} target="_blank" rel="noreferrer">
            <svg
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
              className={classes.twitterIcon}
              data-v-6cab4e66=""
            >
              <path
                d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84"
                data-v-6cab4e66=""
              ></path>
            </svg>
            {name}
          </a>
        )}

        {!handle && name}
      </Card.Title>
      <Card.Text style={{ paddingTop: '0rem' }}>
      	<span style={{ fontStyle: 'italic' }}>{categoryName}</span>
      	<br />
      	<span style={{ color: 'gray' }}><FontAwesomeIcon icon={faUser} /> {creatorName}</span>
      </Card.Text>
      <Button className={classes.primaryBtnItem}>Get</Button>
    </>
  );
};

const ItemCards: React.FC<{encodedImages: EncodedImage[]}> = props => {
  const { encodedImages } = props;

  return (
    <>
      {encodedImages.map(encodedImage => (
        <Col xs={2} md={2} lg={2} className={classes.itemGroup}>
          <ItemCard {...encodedImage} />
        </Col>
      ))}
    </>
  );
};

/*
const traitKeyToTitle: Record<string, string> = {
  heads: 'head',
  glasses: 'glasses',
  bodies: 'body',
  accessories: 'accessory',
};
*/

const traitKeyToLocalizedTraitKeyFirstLetterCapitalized = (s: string): ReactNode => {
  const traitMap = new Map([
    ['background', <Trans>Category</Trans>],
    ['body', <Trans>Creator</Trans>],
    ['accessory', <Trans>Price</Trans>],
    ['head', <Trans>Head</Trans>],
    ['glasses', <Trans>Glasses</Trans>],
  ]);

  return traitMap.get(s);
};

const MarketPage = () => {
    
  const [traits, setTraits] = useState<Trait[]>();
  const [initLoad, setInitLoad] = useState<boolean>(true);
  const [selectIndexes, setSelectIndexes] = useState<Record<string, number>>({});
  const [modSeed, setModSeed] = useState<{ [key: string]: number }>();
  
  useEffect(() => {

	const creators: string[] = [];
	const categories: string[] = [];
	const encodedImages: EncodedImage[]  = ComposablesImageData.images.composables;
	
	encodedImages.forEach(encodedImage => {
	    if (creators.indexOf(parseCreatorName(encodedImage.filename)) === -1) {
	        creators.push(parseCreatorName(encodedImage.filename))
	    }
	});
	encodedImages.forEach(encodedImage => {
	    if (categories.indexOf(parseCategoryName(encodedImage.filename)) === -1) {
	        categories.push(parseCategoryName(encodedImage.filename))
	    }
	});
	
    setTraits([
    	{title: 'Creator', traitNames: creators}, 
    	{title: 'Category', traitNames: categories}
    ]);
	
	/*	
    const traitNames = [
      ['cool', 'warm'],
      ...Object.values(ImageData.images).map(i => {
        return i.map(imageData => imageData.filename);
      }),
    ];
    setTraits(
      traitTitles.map((value, index) => {
        return {
          title: value,
          traitNames: traitNames[index],
        };
      }),
    );
    */

    if (initLoad) {
      //generateNounSvg(8);
      setInitLoad(false);
    }
  }, [/*generateNounSvg,*/ initLoad]);

  const traitOptions = (trait: Trait) => {
    return Array.from(Array(trait.traitNames.length + 1)).map((_, index) => {
      const traitName = trait.traitNames[index - 1];
      const parsedTitle = index === 0 ? `Any` : parseTraitName(traitName);
      return (
        <option key={index} value={traitName}>
          {parsedTitle}
        </option>
      );
    });
  };

  const traitButtonHandler = (trait: Trait, traitIndex: number) => {
  	/*
    setModSeed(prev => {
      // -1 traitIndex = random
      if (traitIndex < 0) {
        let state = { ...prev };
        delete state[trait.title];
        return state;
      }
      return {
        ...prev,
        [trait.title]: traitIndex,
      };
    });
    */
  };

  var encodedImages: EncodedImage[] = ComposablesImageData.images.composables;
  
  if (traits) {
	  const selectedCreator = traits[0].traitNames[selectIndexes?.['Creator']] ?? undefined;
	  const selectedCategory = traits[1].traitNames[selectIndexes?.['Category']] ?? undefined;
	  
	  if (selectedCreator !== undefined) {
	  	encodedImages = encodedImages.filter(encodedImage => parseCreatorName(encodedImage.filename) === selectedCreator);
	  }
	  
	  if (selectedCategory !== undefined) {
	  	encodedImages = encodedImages.filter(encodedImage => parseCategoryName(encodedImage.filename) === selectedCategory);
	  }
  }
  
  /*
  selectIndexes.forEach(selectedIndex => {
  	if (droppableItem.id === listId) {
		items = droppableItem.items;
	}
  });  	

	const svg = buildSVG(partsComposed.filter(part => part != null), imageData.palette, background);
  */
  
  return (
      <Container fluid="lg">
        <Row>
          <Col lg={10} className={classes.headerRow}>
            <span>
              <Trans>Browse</Trans>
            </span>
            <h1>
              <Trans>Marketplace</Trans>
            </h1>
            <p>
                Browse the Composables marketplace, 
                where you can find items created by artists and creators from the Nouns community.
                If you're an artist, you'll soon be able to upload and sell your traits in a permissionless fashion!
            </p>
          </Col>
        </Row>
        <Row>
          <Col lg={3}>
            <Col lg={12}>
              <Button
                className={classes.primaryBtnSearch}
              >
                <Trans>Search</Trans>
              </Button>
            </Col>
            <Row>
              {traits &&
                traits.map((trait, index) => {
                  return (
                    <Col lg={12} xs={6}>
                      <Form className={classes.traitForm}>
                        <FloatingLabel
                          controlId="floatingSelect"
                          label={trait.title}
                          key={index}
                          className={classes.floatingLabel}
                        >
                          <Form.Select
                            aria-label="Floating label select example"
                            className={classes.traitFormBtn}
                            value={trait.traitNames[selectIndexes?.[trait.title]] ?? -1}
                            onChange={e => {
                              let index = e.currentTarget.selectedIndex;
                              traitButtonHandler(trait, index - 1); // - 1 to account for 'random'
                              setSelectIndexes({
                                ...selectIndexes,
                                [trait.title]: index - 1,
                              });
                            }}
                          >
                            {traitOptions(trait)}
                          </Form.Select>
                        </FloatingLabel>
                      </Form>
                    </Col>
                  );
                })}
            </Row>            
          </Col>
          <Col lg={9}>
            <Row>
		        <Row style={{ marginBottom: '0rem' }}>
		          <ItemCards encodedImages={encodedImages} />
		        </Row>
            </Row>
          </Col>
        </Row>
      </Container>
  );
};

export default MarketPage;
