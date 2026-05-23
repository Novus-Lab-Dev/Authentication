import { useEffect } from "react";

export default function Callback() {

  useEffect(() => {

    window.location.href = "/";

  }, []);

  return (
    <h1>Logging in...</h1>
  );
}