import React from "react";
import "./CTabs.css";

function CTabs({ tabState, setTabState = () => {}, tabs = [] }) {
  const getSelectedTabContent = () => {
    const idx = tabs.map((tab) => tab["name"]).indexOf(tabState);
    return tabs[idx]?.slot;
  };

  return (
    <div className="c-tabs">
      <div className="c-tabs-header">
        {tabs &&
          tabs.map((tab) => {
            return (
              <div
                key={"tab-" + tab.name}
                onClick={() => setTabState(tab.name)}
                className={`c-tab ${tab.name} ${
                  tabState == tab.name ? "c-tab-active" : ""
                }`}
              >
                {tab.name}
              </div>
            );
          })}
      </div>
      {getSelectedTabContent()}
    </div>
  );
}

export default CTabs;
