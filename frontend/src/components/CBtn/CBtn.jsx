import React, { useState } from "react";

function CBtn({
  windowIdent,
  dataSetIdent,
  children,
  onClick = async () => {},
}) {
  // const [loading, setLoading] = useState(false);
  const callOnClickAction = async () => {
    await onClick();
    // setLoading(true);
    // try {
    //   await onClick();
    // } catch (error) {
    //   alert(JSON.stringify(error));
    // }
    // setLoading(false);
  };

  return <button onClick={callOnClickAction}>{children}</button>;
}

export default CBtn;
