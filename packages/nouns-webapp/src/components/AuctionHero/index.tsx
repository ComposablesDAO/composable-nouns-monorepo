import { Col } from 'react-bootstrap';
import { StandaloneNounWithSeed } from '../StandaloneNoun';
import AuctionHeroText from '../AuctionHeroText';
import { Row, Container } from 'react-bootstrap';
import { setStateBackgroundColor } from '../../state/slices/application';
import { LoadingNoun } from '../Noun';
import { Auction as IAuction } from '../../wrappers/nounsAuction';
import classes from './AuctionHero.module.css';
import { INounSeed } from '../../wrappers/nounToken';
import { useHistory } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks';
import {
  setNextOnDisplayAuctionNounId,
  setPrevOnDisplayAuctionNounId,
} from '../../state/slices/onDisplayAuction';
import { beige, grey } from '../../utils/nounBgColors';

interface AuctionProps {
  auction?: IAuction;
  onJoinClick: () => void;
}

const AuctionHero: React.FC<AuctionProps> = props => {
  const { auction: currentAuction, onJoinClick } = props;

  const history = useHistory();
  const dispatch = useAppDispatch();
  let stateBgColor = useAppSelector(state => state.application.stateBackgroundColor);
  const lastNounId = useAppSelector(state => state.onDisplayAuction.lastAuctionNounId);

  const loadedNounHandler = (seed: INounSeed) => {
    dispatch(setStateBackgroundColor(seed.background === 0 ? grey : beige));
  };

  const prevAuctionHandler = () => {
    dispatch(setPrevOnDisplayAuctionNounId());
    currentAuction && history.push(`/noun/${currentAuction.nounId.toNumber() - 1}`);
  };
  const nextAuctionHandler = () => {
    dispatch(setNextOnDisplayAuctionNounId());
    currentAuction && history.push(`/noun/${currentAuction.nounId.toNumber() + 1}`);
  };

  const nounContent = currentAuction && (
    <div className={classes.nounWrapper}>
      <StandaloneNounWithSeed
        nounId={currentAuction.nounId}
        onLoadSeed={loadedNounHandler}
        shouldLinkToProfile={false}
      />
    </div>
  );

  const loadingNoun = (
    <div className={classes.nounWrapper}>
      <LoadingNoun />
    </div>
  );

  const currentAuctionActivityContent = currentAuction && lastNounId && (
    <AuctionHeroText
      auction={currentAuction}
      isFirstAuction={currentAuction.nounId.eq(0)}
      isLastAuction={currentAuction.nounId.eq(lastNounId)}
      onPrevAuctionClick={prevAuctionHandler}
      onNextAuctionClick={nextAuctionHandler}
      displayGraphDepComps={true}
      onJoinClick={onJoinClick}
    />
  );

  return (
    <div style={{ backgroundColor: stateBgColor }} className={classes.wrapper}>
      <Container fluid="xl">
        <Row>
          <Col lg={{ span: 6 }} className={classes.auctionActivityCol}>
            {currentAuction &&
              (currentAuctionActivityContent)}
          </Col>
          <Col lg={{ span: 6 }} className={classes.nounContentCol}>
            {currentAuction ? nounContent : loadingNoun}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AuctionHero;
