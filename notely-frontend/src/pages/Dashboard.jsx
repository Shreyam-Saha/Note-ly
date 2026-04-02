import { useEffect, useState } from "react";
import api from "../services/api";

export default function Dashboard() {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    let ignore = false;

    api.get("/notes").then((res) => {
      if (!ignore) setNotes(Array.isArray(res.data) ? res.data : []);
    });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div>
      <h2>Your Notes</h2>

      {notes.map((note) => (
        <div key={note.id}>
          <h3>{note.title}</h3>
        </div>
      ))}
    </div>
  );
}