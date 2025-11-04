import React from "react";
import "./CPager.css";

function CPager({ currentPage = 1, setCurrentPage = () => {}, pagesNo = 1 }) {
  const setPrevPage = () => {
    if (currentPage == 1) return;
    const pageToSet = currentPage - 1;

    setCurrentPage(pageToSet);
  };
  const setNextPage = () => {
    if (currentPage == pagesNo) return;
    const pageToSet = currentPage + 1;

    setCurrentPage(pageToSet);
  };

  return (
    <div className="c-pager">
      <div className="c-prev-page" onClick={() => setPrevPage()}>
        <img src="/icons/arrowLeft.svg" />
      </div>
      <div className="c-pages-count">
        {currentPage} / {pagesNo}
      </div>
      <div className="c-next-page" onClick={() => setNextPage()}>
        <img src="/icons/arrowRight.svg" />
      </div>
    </div>
  );
}

export default CPager;
