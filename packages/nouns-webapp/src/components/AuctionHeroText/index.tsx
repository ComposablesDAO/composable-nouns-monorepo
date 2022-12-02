import { Auction } from '../../wrappers/nounsAuction';
import { Row, Col, Button } from 'react-bootstrap';
import classes from './AuctionHeroText.module.css';
import AuctionActivityWrapper from '../AuctionActivityWrapper';
import { useAppSelector } from '../../hooks';

interface AuctionActivityProps {
  auction: Auction;
  isFirstAuction: boolean;
  isLastAuction: boolean;
  onPrevAuctionClick: () => void;
  onNextAuctionClick: () => void;
  displayGraphDepComps: boolean;
  onJoinClick: () => void;
}

const AuctionHeroText: React.FC<AuctionActivityProps> = (props: AuctionActivityProps) => {
  const {
    auction,
    onJoinClick,
  } = props;

  const isCool = useAppSelector(state => state.application.isCoolBackground);

  if (!auction) return null;

  return (
    <>
      <AuctionActivityWrapper>
        <div className={classes.informationRow}>
          <Row className={classes.activityRow}>
            <Col lg={12}>
		      <h1 style={{ color: isCool ? 'var(--brand-cool-dark-text)' : 'var(--brand-warm-dark-text)' }}>
		        What will you build?
		      </h1>
            </Col>
          </Row>
        </div>
          <Row className={classes.activityRow}>
            <Col lg={12} className={classes.subTagline}>
                Customize and upgrade your Noun, and have it interact with other extensions, all on-chain
            </Col>
          </Row>
        <Row className={classes.activityRow}>
          <Col lg={12}>
          <Button href="/market" className={classes.bidBtn}>Explore</Button>
          &nbsp;
          <Button onClick={() => onJoinClick()} className={classes.bidBtn}>Join the DAO</Button>
          </Col>
        </Row>
      </AuctionActivityWrapper>
    </>
  );
};

export default AuctionHeroText;
