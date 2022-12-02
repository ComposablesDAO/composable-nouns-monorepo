import { useState } from 'react';
import Banner from '../../components/Banner';
import Auction from '../../components/Auction';
import AuctionHero from '../../components/AuctionHero';
import Documentation from '../../components/Documentation';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { setOnDisplayAuctionNounId } from '../../state/slices/onDisplayAuction';
import { push } from 'connected-react-router';
import { nounPath } from '../../utils/history';
import useOnDisplayAuction from '../../wrappers/onDisplayAuction';
import { useEffect } from 'react';
import ProfileActivityFeed from '../../components/ProfileActivityFeed';

import { Carousel } from 'react-bootstrap';

interface AuctionPageProps {
  initialAuctionId?: number;
}

const AuctionPage: React.FC<AuctionPageProps> = props => {
  const { initialAuctionId } = props;
  const onDisplayAuction = useOnDisplayAuction();
  const lastAuctionNounId = useAppSelector(state => state.onDisplayAuction.lastAuctionNounId);
  const onDisplayAuctionNounId = onDisplayAuction?.nounId.toNumber();
  const [carouselIndex, setCarouselIndex] = useState<number>();

  const dispatch = useAppDispatch();
  
  const showActivityFeed = false;

  useEffect(() => {
    if (!lastAuctionNounId) return;

    if (initialAuctionId !== undefined) {
      // handle out of bounds noun path ids
      if (initialAuctionId > lastAuctionNounId || initialAuctionId < 0) {
        dispatch(setOnDisplayAuctionNounId(lastAuctionNounId));
        dispatch(push(nounPath(lastAuctionNounId)));
      } else {
        if (onDisplayAuction === undefined) {
          // handle regular noun path ids on first load
          dispatch(setOnDisplayAuctionNounId(initialAuctionId));
        }
      }
    } else {
      // no noun path id set
      if (lastAuctionNounId) {
        dispatch(setOnDisplayAuctionNounId(lastAuctionNounId));
      }
    }
  }, [lastAuctionNounId, dispatch, initialAuctionId, onDisplayAuction]);

  const onJoinClick = () => {
  	setCarouselIndex(1); //assume the bid panel is the 2nd one
  };

  return (
    <>
    <Carousel variant="dark" interval={10000} activeIndex={carouselIndex}>
      <Carousel.Item>

	      <AuctionHero auction={onDisplayAuction} onJoinClick={onJoinClick} />

      </Carousel.Item>
      <Carousel.Item>

	      <Auction auction={onDisplayAuction} />

      </Carousel.Item>
    </Carousel>

      {onDisplayAuctionNounId !== undefined && onDisplayAuctionNounId !== lastAuctionNounId && showActivityFeed ? (
        <ProfileActivityFeed nounId={onDisplayAuctionNounId} />
      ) : (
        <></>
      )}
      <Banner />
      <Documentation />
    </>
  );
};
export default AuctionPage;
