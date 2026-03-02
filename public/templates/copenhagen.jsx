import React from "react";

const TemplateCopenhagen = ({ data }) => {
  return (
    <div style={{ fontFamily: "Inter", background: "#F9F4EC", padding: "40px", maxWidth: "850px", margin: "auto" }}>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        
        <div style={{ display: "flex", gap: "20px" }}>
          <div style={{ width: "90px", height: "90px", overflow: "hidden", borderRadius: "5px" }}>
            <img src={data.photoURL} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>

          <div>
            <h1 style={{ margin: 0 }}>{data.firstName} {data.lastName}</h1>
            <p style={{ margin: "5px 0" }}>{data.jobTitle}</p>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <p>{data.email}</p>
          <p>{data.phone}</p>
          <p>{data.address}, {data.city}</p>
        </div>
      </div>

      <hr style={{ margin: "25px 0", borderTop: "2px solid #000" }} />

      <h2 style={{ marginTop: "10px" }}>{data.summaryTitle || ""}</h2>
      <p>{data.summary}</p>

      <h3 style={{ marginTop: "30px" }}>Skills</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "25px" }}>
        {data.skills.map((s, i) => (
          <div key={i}>— {s}</div>
        ))}
      </div>

      <h3 style={{ marginTop: "40px" }}>Employment History</h3>
      {data.experience.map((exp, i) => (
        <div key={i} style={{ marginTop: "20px" }}>
          <p><b>{exp.role}</b> at {exp.company}, {exp.location}</p>
          <p style={{ fontStyle: "italic" }}>{exp.start} — {exp.end}</p>
          <ul>
            {exp.details.map((d, j) => <li key={j}>{d}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default TemplateCopenhagen;
