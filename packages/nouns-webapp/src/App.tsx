import { useEffect } from 'react';
import { ChainId, useEthers } from '@usedapp/core';
import { useAppDispatch, useAppSelector } from './hooks';
import { setActiveAccount } from './state/slices/account';
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom';
import { setAlertModal } from './state/slices/application';
import classes from './App.module.css';
import '../src/css/globals.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import AlertModal from './components/Modal';
import NavBar from './components/NavBar';
import NetworkAlert from './components/NetworkAlert';
import Footer from './components/Footer';
import AuctionPage from './pages/Auction';
import GovernancePage from './pages/Governance';
import CreateProposalPage from './pages/CreateProposal';
import VotePage from './pages/Vote';
import NoundersPage from './pages/Nounders';
import NotFoundPage from './pages/NotFound';
import Playground from './pages/Playground';
import CollectionsPage from './pages/Collections';
import CollectionPage from './pages/Collection';
import ProfilePage from './pages/Profile';
import ComposerPage from './pages/Composer';
import MarketPage from './pages/Market';

import { CHAIN_ID } from './config';
import relativeTime from 'dayjs/plugin/relativeTime';
import { AvatarProvider } from '@davatar/react';
import dayjs from 'dayjs';
import DelegatePage from './pages/DelegatePage';

function App() {
  const { account, chainId, library } = useEthers();
  const dispatch = useAppDispatch();
  dayjs.extend(relativeTime);

  useEffect(() => {
    // Local account array updated
    dispatch(setActiveAccount(account));
  }, [account, dispatch]);

  const alertModal = useAppSelector(state => state.application.alertModal);

  return (
    <div className={`${classes.wrapper}`}>
      {Number(CHAIN_ID) !== chainId && <NetworkAlert />}
      {alertModal.show && (
        <AlertModal
          title={alertModal.title}
          content={<p>{alertModal.message}</p>}
          onDismiss={() => dispatch(setAlertModal({ ...alertModal, show: false }))}
        />
      )}
      <BrowserRouter>
        <AvatarProvider
          provider={chainId === ChainId.Mainnet ? library : undefined}
          batchLookups={true}
        >
          <NavBar />
          <Switch>
            <Route exact path="/" component={AuctionPage} />
            <Redirect from="/auction/:id" to="/noun/:id" />
            <Route
              exact
              path="/noun/:id"
              render={props => <AuctionPage initialAuctionId={Number(props.match.params.id)} />}
            />
            <Route exact path="/nounders" component={NoundersPage} />
            <Route exact path="/create-proposal" component={CreateProposalPage} />
            <Route exact path="/vote" component={GovernancePage} />
            <Route exact path="/vote/:id" component={VotePage} />
            <Route exact path="/playground" component={Playground} />
            <Route exact path="/delegate" component={DelegatePage} />

            <Route exact path="/collections" component={CollectionsPage} />
            <Route exact path="/collection/:address"
              render={props => <CollectionPage collectionAddress={props.match.params.address} />}
            />
            <Route exact path="/collection/:address/:id"
              render={props => <CollectionPage collectionAddress={props.match.params.address} tokenId={Number(props.match.params.id)} />}
            />
            <Route exact path="/profile/:address"
              render={props => <ProfilePage walletAddress={props.match.params.address} />}
            />
            <Route exact path="/composer" component={ComposerPage} />
            <Route exact path="/market" component={MarketPage} />
            
            <Route component={NotFoundPage} />
          </Switch>
          <Footer />
        </AvatarProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
