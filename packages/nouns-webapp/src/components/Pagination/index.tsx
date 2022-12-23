import classes from './Pagination.module.css';
import clsx from 'clsx';
import { usePagination, DOTS } from './usePagination';

const Pagination: React.FC<{ onPageChange: (pageNumber: number) => void; totalCount: number; siblingCount?: number; currentPage: number; pageSize: number; }> = props => {
  const {
    onPageChange,
    totalCount,
    siblingCount = 1,
    currentPage,
    pageSize
  } = props;

  const paginationRange = usePagination({
    currentPage,
    totalCount,
    siblingCount,
    pageSize
  });
  
  if (!paginationRange) {
  	return null;
  }

  if (currentPage === 0 || paginationRange.length < 1) {
    return null;
  }

  const onNext = () => {
    onPageChange(currentPage + 1);
  };

  const onPrevious = () => {
    onPageChange(currentPage - 1);
  };

  let lastPage = paginationRange[paginationRange.length - 1];
  return (
  	<div className={clsx( classes.paginationHeader )}>
    <ul
      className={clsx(classes.paginationContainer, classes.paginationBar )}
      style={{marginBottom: '0px', padding: '0px'}}
    >
      <li
        className={clsx(classes.paginationItem,
          (currentPage === 1) ? classes.disabled : '')}
        onClick={onPrevious}
      >
        <div className={clsx(classes.arrow, classes.left)} />
      </li>
      {paginationRange.map(pageNumber => {
        if (pageNumber === DOTS) {
          return <li className={clsx(classes.paginationItem, classes.dots)}>&#8230;</li>;
        }

        return (
          <li
            className={clsx(classes.paginationItem,
              (pageNumber === currentPage) ? classes.selected : '')}
            onClick={() => onPageChange(pageNumber)}
          >
            {pageNumber}
          </li>
        );
      })}
      <li
        className={clsx(classes.paginationItem,
          (currentPage === lastPage) ? classes.disabled : '')}
        onClick={onNext}
      >
        <div className={clsx(classes.arrow, classes.right)} />
      </li>
    </ul>

  		<span>{totalCount.toLocaleString()} items</span>
    
    </div>
  );
};

export default Pagination;
