import { useEffect, useState } from "react";
import api from "../api/api.js";

export default function ApiStatus() {
  const [status, setStatus] = useState({ api: "checking", database: "checking" });

  useEffect(() => {
    api.get("/health")
      .then(({ data }) => {
        setStatus({
          api: "online",
          database: data.database?.connected ? "connected" : "pending"
        });
      })
      .catch(() => setStatus({ api: "offline", database: "offline" }));
  }, []);

  return (
    <div className="api-status" aria-label="System status">
      <span className={status.api === "online" ? "ok" : "bad"} />
      API {status.api}
      <span className={status.database === "connected" ? "ok" : "warn"} />
      MongoDB {status.database}
    </div>
  );
}
