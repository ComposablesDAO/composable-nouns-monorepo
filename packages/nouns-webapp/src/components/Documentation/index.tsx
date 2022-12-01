import Section from '../../layout/Section';
import { Col } from 'react-bootstrap';
import classes from './Documentation.module.css';
import Accordion from 'react-bootstrap/Accordion';
import Link from '../Link';
import { Trans } from '@lingui/macro';

const Documentation = () => {
  const playgroundLink = (
    <Link text={<Trans>Playground</Trans>} url="/playground" leavesPage={false} />
  );
  const publicDomainLink = (
    <Link
      text={<Trans>public domain</Trans>}
      url="https://creativecommons.org/publicdomain/zero/1.0/"
      leavesPage={true}
    />
  );
  const compoundGovLink = (
    <Link
      text={<Trans>Compound Governance</Trans>}
      url="https://compound.finance/governance"
      leavesPage={true}
    />
  );
  return (
    <Section fullWidth={false}>
      <Col lg={12}>
        <div className={classes.headerWrapper}>
          <h1>
            <Trans>WTF?</Trans>
          </h1>
          <p className={classes.aboutText} style={{ paddingBottom: '4rem' }}>
              Composables is a framework that builds upon the Nouns protocol, an experimental attempt to improve the formation of on-chain avatar
              communities by bootstrapping identity, community, governance, and a shared treasury. 

              <br /><br />

              Composables extends the experiment by bringing composability and upgradeability to the Nouns protocol.
              The framework also provides interoperability between Nouns extensions that fork from the Nouns protocol.

              <br /><br />
              The Composables DAO is the main governing body of the Composables ecosystem.              
              The Composables DAO treasury receives 100% of ETH proceeds from the daily CX Noun auctions, 
              as well as a 5% listing fee from the Composables Marketplace.
          </p>
        </div>
        <Accordion flush>
          <Accordion.Item eventKey="0" className={classes.accordionItem}>
            <Accordion.Header className={classes.accordionHeader}>
              <Trans>Summary</Trans>
            </Accordion.Header>
            <Accordion.Body>
              <ul>
                <li>
                  <Trans>CX Nouns artwork is in the {publicDomainLink}.</Trans>
                </li>
                <li>
                  <Trans>One CX Noun is trustlessly auctioned every 24 hours, forever.</Trans>
                </li>
                <li>
                  <Trans>100% of CX Noun auction proceeds are trustlessly sent to the treasury.</Trans>
                </li>
                <li>
                  <Trans>Settlement of one auction kicks off the next.</Trans>
                </li>
                <li>
                  <Trans>All CX Nouns are members of Composables DAO.</Trans>
                </li>
                <li>
                  Composables DAO uses a fork of {compoundGovLink}.
                </li>
                <li>
                  <Trans>One CX Noun is equal to one vote.</Trans>
                </li>
                <li>
                  <Trans>The treasury is controlled exclusively by CX Nouns via governance.</Trans>
                </li>
                <li>
                  <Trans>Artwork is generative and stored directly on-chain (not IPFS).</Trans>
                </li>
                <li>
                  <Trans>
                    No explicit rules exist for attribute scarcity; all CX Nouns are equally rare.
                  </Trans>
                </li>
                <li>
                  <Trans>
                    CX Nounders receive rewards in the form of CX Nouns (10% of supply for first 5 years).
                  </Trans>
                </li>
              </ul>
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="1" className={classes.accordionItem}>
            <Accordion.Header className={classes.accordionHeader}>
              <Trans>Daily Auctions</Trans>
            </Accordion.Header>
            <Accordion.Body>
              <p className={classes.aboutText}>
                <Trans>
                  The CX Nouns Auction Contract will act as a self-sufficient CX Noun generation and
                  distribution mechanism, auctioning one CX Noun every 24 hours, forever. 100% of
                  auction proceeds (ETH) are automatically deposited in the Composables DAO treasury,
                  where they are governed by CX Noun owners.
                </Trans>
              </p>

              <p className={classes.aboutText}>
                  Each time an auction is settled, the settlement transaction will also cause a new
                  CX Noun to be minted and a new 24 hour auction to begin.{' '}
              </p>
              <p>
                <Trans>
                  While settlement is most heavily incentivized for the winning bidder, it can be
                  triggered by anyone, allowing the system to trustlessly auction CX Nouns as long as
                  Ethereum is operational and there are interested bidders.
                </Trans>
              </p>
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="2" className={classes.accordionItem}>
            <Accordion.Header className={classes.accordionHeader}>
              <Trans>Composables DAO</Trans>
            </Accordion.Header>
            <Accordion.Body>
                Composables DAO utilizes a fork of {compoundGovLink} and is the main governing body of the
                Composables ecosystem. The Composables DAO treasury receives 100% of ETH proceeds from daily
                CX Noun auctions, as well as a 5% listing fee from the Composables Marketplace. 
                Each CX Noun is an irrevocable member of Composables DAO and entitled to one
                vote in all governance matters. CX Noun votes are non-transferable (if you sell your
                CX Noun the vote goes with it) but delegatable, which means you can assign your vote to
                someone else as long as you own your CX Noun.
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="3" className={classes.accordionItem}>
            <Accordion.Header className={classes.accordionHeader}>
              <Trans>Governance ‘Slow Start’</Trans>
            </Accordion.Header>
            <Accordion.Body>
              <p>
                <Trans>
                  The proposal veto right was initially envisioned as a temporary solution to the
                  problem of ‘51% attacks’ on the Composables treasury. While CX Nounders initially
                  believed that a healthy distribution of CX Nouns would be sufficient protection for
                  the DAO, a more complete understanding of the incentives and risks has led to
                  general consensus within the CX Nounders and the wider
                  community that a more robust game-theoretic solution should be implemented before
                  the right is removed.
                </Trans>
              </p>
              <p>
                <Trans>
                  The CX Nounders consider the veto an emergency power that should not be
                  exercised in the normal course of business. The CX Nounders will veto
                  proposals that introduce non-trivial legal or existential risks to the Composables DAO
                  , including (but not necessarily limited to) proposals
                  that:
                </Trans>
              </p>
              <ul>
                <li>unequally withdraw the treasury for personal gain</li>
                <li>bribe voters to facilitate withdraws of the treasury for personal gain</li>
                <li>
                  attempt to alter CX Noun auction cadence for the purpose of maintaining or acquiring
                  a voting majority
                </li>
                <li>make upgrades to critical smart contracts without undergoing an audit</li>
              </ul>
              <p>
                <Trans>
                  There are unfortunately no algorithmic solutions for making these determinations
                  in advance (if there were, the veto would not be required), and proposals must be
                  considered on a case by case basis.
                </Trans>
              </p>
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="4" className={classes.accordionItem}>
            <Accordion.Header className={classes.accordionHeader}>
              <Trans>CX Noun Traits</Trans>
            </Accordion.Header>
            <Accordion.Body>
              <p>
                <Trans>
                  CX Nouns are generated randomly based Ethereum block hashes. There are no 'if'
                  statements or other rules governing CX Noun trait scarcity, which makes all CX Nouns
                  equally rare. As of this writing, CX Nouns are made up of:
                </Trans>
              </p>
              <ul>
                <li>
                  <Trans>backgrounds (2) </Trans>
                </li>
                <li>
                  <Trans>bodies (30)</Trans>
                </li>
                <li>
                  <Trans>accessories (140) </Trans>
                </li>
                <li>
                  <Trans>heads (242) </Trans>
                </li>
                <li>
                  <Trans>glasses (23)</Trans>
                </li>
              </ul>
                You can experiment with off-chain CX Noun generation at the {playgroundLink}.
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="5" className={classes.accordionItem}>
            <Accordion.Header className={classes.accordionHeader}>
              <Trans>On-Chain Artwork</Trans>
            </Accordion.Header>
            <Accordion.Body>
              <p>
                <Trans>
                  CX Nouns are stored directly on Ethereum and do not utilize pointers to other
                  networks such as IPFS. This is possible because CX Noun parts are compressed and
                  stored on-chain using a custom run-length encoding (RLE), which is a form of
                  lossless compression.
                </Trans>
              </p>

              <p>
                <Trans>
                  The compressed parts are efficiently converted into a single base64 encoded SVG
                  image on-chain. To accomplish this, each part is decoded into an intermediate
                  format before being converted into a series of SVG rects using batched, on-chain
                  string concatenation. Once the entire SVG has been generated, it is base64
                  encoded.
                </Trans>
              </p>
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="6" className={classes.accordionItem}>
            <Accordion.Header className={classes.accordionHeader}>
              <Trans>Seeder Contract</Trans>
            </Accordion.Header>
            <Accordion.Body>
              <p>
                <Trans>
                  The CX Noun Seeder contract is used to determine CX Noun traits during the minting
                  process. The seeder contract can be replaced to allow for future trait generation
                  algorithm upgrades. Additionally, it can be locked by the Composables DAO to prevent any
                  future updates. Currently, CX Noun traits are determined using pseudo-random number
                  generation:
                </Trans>
              </p>
              <code>keccak256(abi.encodePacked(blockhash(block.number - 1), nounId))</code>
              <br />
              <br />
              <p>
                <Trans>
                  Trait generation is not truly random. Traits can be predicted when minting a CX Noun
                  on the pending block.
                </Trans>
              </p>
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="7" className={classes.accordionItem}>
            <Accordion.Header className={classes.accordionHeader}>
              <Trans>Founder's Reward</Trans>
            </Accordion.Header>
            <Accordion.Body>
              <p>
                <Trans>
                  'CX Nounders' are a group of builders that initiated CX Nouns. Here are the
                  CX Nounders:
                </Trans>
              </p>
              <ul>
                <li>
                  <Link
                    text="@manofmissle"
                    url="https://twitter.com/manofmissle"
                    leavesPage={true}
                  />
                </li>
                <li>
                  <Link text="@juanhernanx" url="https://twitter.com/juanhernanx" leavesPage={true} />
                </li>
              </ul>
              <p>
                <Trans>
                  Because 100% of CX Noun auction proceeds are sent to Composables DAO, CX Nounders have chosen
                  to compensate themselves with CX Nouns. Every 10th CX Noun for the first 5 years of the
                  project (CX Noun ids #0, #10, #20, #30 and so on) will be automatically sent to the
                  CX Nounder's multisig to be vested and shared among the founding members of the
                  project.
                </Trans>
              </p>
              <p>
                <Trans>
                  CX Nounder distributions don't interfere with the cadence of 24 hour auctions. CX Nouns
                  are sent directly to the CX Nounder's Multisig, and auctions continue on schedule
                  with the next available CX Noun ID.
                </Trans>
              </p>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Col>
    </Section>
  );
};
export default Documentation;
