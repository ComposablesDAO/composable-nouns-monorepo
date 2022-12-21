import classes from './ComposerTour.module.css';
import React, { useState, useContext } from 'react';

import { ShepherdTour, ShepherdTourContext, ShepherdOptionsWithType } from 'react-shepherd'
import 'shepherd.js/dist/css/shepherd.css';
import './shepherd.css';

const tourOptions = {
  defaultStepOptions: {
    cancelIcon: {
      enabled: true
    },
  },
  useModalOverlay: true
};

const steps: ShepherdOptionsWithType[] = [
  {
    id: 'composer-selecter',
    attachTo: { element: '.composer-selecter', on: 'bottom' },
    beforeShowPromise: function () {
      return new Promise<void>(function (resolve) {
        setTimeout(function () {
          window.scrollTo(0, 0);
          resolve();
        }, 500);
      });
    },
    buttons: [
      {
        classes: classes.secondaryBtnTour,
        text: 'Exit',
        type: 'cancel'
      },
      {
        classes: classes.primaryBtnTour,
        text: 'Next',
        type: 'next'
      }
    ],
    highlightClass: 'highlight',
    scrollTo: true,
    cancelIcon: {
      enabled: true,
    },
    title: 'Customize your Noun',
    text: ['Click on the available traits to add them to your Noun. You can also move them around the canvas to get your desired look.'],
    when: {
      show: () => {
      },
      hide: () => {
      }
    }
  },
  {
    id: 'composer-saver',
    attachTo: { element: '.composer-saver', on: 'bottom' },
    buttons: [
      {
        classes: classes.secondaryBtnTour,
        text: 'Exit',
        type: 'cancel'
      },
      {
        classes: classes.primaryBtnTour,
        text: 'Back',
        type: 'back'
      },
      {
        classes: classes.primaryBtnTour,
        text: 'Next',
        type: 'next'
      }
    ],
    highlightClass: 'highlight',
    scrollTo: true,
    cancelIcon: {
      enabled: true,
    },
    title: 'Save your Noun',
    text: ['You can commit the changes to your Noun on-chain, or simply download the image to use right away.'],
    when: {
      show: () => {
      },
      hide: () => {
      }
    }
  },  
  {
    id: 'composer-uploader',
    attachTo: { element: '.composer-uploader', on: 'bottom' },
    buttons: [
      {
        classes: classes.secondaryBtnTour,
        text: 'Exit',
        type: 'cancel'
      },
      {
        classes: classes.primaryBtnTour,
        text: 'Back',
        type: 'back'
      },
    ],
    highlightClass: 'highlight',
    scrollTo: true,
    cancelIcon: {
      enabled: true,
    },
    title: 'Upload custom traits',
    text: ['You can even upload custom traits to use with your Noun. Give it a try!'],
    when: {
      show: () => {
      },
      hide: () => {
      }
    }
  },
];

const ComposerTour: React.FC<{ svg: string }> = props => {
  const { svg } = props;

  const [initLoadTour, setInitLoadTour] = useState<boolean>(true);
  
  function TourLoader() {
  	const tour = useContext(ShepherdTourContext);
  	if (initLoadTour && tour) {
  		tour.start();
		setInitLoadTour(false);
	}
	
	return <></>;
  }


  return (
    <>
      {svg && (
        <ShepherdTour steps={steps} tourOptions={tourOptions}>
          <TourLoader />
        </ShepherdTour>
      )}      
    </>
  );
};
export default ComposerTour;
