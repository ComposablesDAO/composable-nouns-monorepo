import { useReverseENSLookUp } from '../../utils/ensLookup';
import { resolveNounContractAddress } from '../../utils/resolveNounsContractAddress';
import { useEthers } from '@usedapp/core';
import classes from './ShortAddress.module.css';
import { containsBlockedText } from '../../utils/moderation/containsBlockedText';
import { useShortAddress } from '../../utils/addressAndENSDisplayUtils';
import React from 'react';
import Identicon from '../Identicon';

const ShortAddress: React.FC<{ address: string; avatar?: boolean; size?: number; link?: boolean; }> = props => {
  const { address, avatar, size = 24, link } = props;
  const { library: provider } = useEthers();

  const ens = useReverseENSLookUp(address) || resolveNounContractAddress(address);
  const ensMatchesBlocklistRegex = containsBlockedText(ens || '', 'en');
  const shortAddress = useShortAddress(address);
  
  const txtAddress = (ens && !ensMatchesBlocklistRegex) ? ens : shortAddress;
  const txtAddressLink = (link) ? <a href={`/profile/${address}`}>{txtAddress}</a> : txtAddress;

  if (avatar) {
    return (
      <div className={classes.shortAddress}>
        {avatar && (
          <div key={address}>
            <Identicon size={size} address={address} provider={provider} />
          </div>
        )}
        <span>{txtAddressLink}</span>
      </div>
    );
  }

  return <>{txtAddressLink}</>;
};

export default ShortAddress;
