import { OverlayTrigger, Popover, Image } from 'react-bootstrap';
import InfoIcon from '../../assets/icons/Info.svg';
import classes from './TooltipInfo.module.css';

const TooltipInfo: React.FC<{tooltipText: string}> = props => {
  const { tooltipText } = props;

  return (
  	<OverlayTrigger
		trigger={["hover", "hover"]}
		placement="top"
		overlay={
			<Popover>
				<div style={{ padding: '0.25rem' }}>
					{tooltipText}
				</div>
			</Popover>
			}
		>
			<Image
				className={classes.infoIcon}
				src={InfoIcon}
			/>			
	</OverlayTrigger>
  );
};

export default TooltipInfo;
