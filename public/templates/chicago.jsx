import React from "react";

const TemplateChicago = ({ data }) => {
  return (
    <div style={{ background: "#0C111A", color: "white", padding: "40px", maxWidth: "850px", margin: "auto", fontFamily: "Inter" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "40px", fontWeight: "700" }}>
            {data.firstName}<br />{data.lastName}
          </h1>
          <p>{data.jobTitle}</p>
        </div>

        <div style={{ width: "100px", height: "100px", borderRadius: "50%", overflow: "hidden" }}>
          <img src={data.photoURL} alt="profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      </div>

      <p>{data.summary}</p>

      <h3 style={{ marginTop: "30px", color: "#B3C7FF" }}>Skills</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
        {data.skills.map((s, i) => (
          <div key={i}>• {s}</div>
        ))}
      </div>

      <h3 style={{ marginTop: "30px", color: "#B3C7FF" }}>Employment History</h3>
      {data.experience.map((exp, i) => (
        <div key={i}>
          <p><b>{exp.role}</b> — {exp.company}, {exp.location}<br />{exp.start} — {exp.end}</p>
          <ul>
            {exp.details.map((detail, j) => (
              <li key={j}>{detail}</li>
            ))}
          </ul>
        </div>
      ))}

    </div>
  );
};

export default TemplateChicago;
