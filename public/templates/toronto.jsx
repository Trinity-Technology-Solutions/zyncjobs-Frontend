import React from "react";

const TemplateToronto = ({ data }) => {
  return (
    <div style={{
      fontFamily: "Inter",
      maxWidth: "900px",
      margin: "auto",
      padding: "40px",
      background: "#FFFFFF"
    }}>

      {/* TOP SECTION */}
      <div style={{ display: "flex", gap: "20px" }}>
        <div style={{ width: "120px", height: "120px", borderRadius: "10px", overflow: "hidden" }}>
          <img src={data.photoURL} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

        <div>
          <h1 style={{ margin: 0 }}>{data.firstName} {data.lastName}</h1>
          <p style={{ marginTop: "5px" }}>{data.jobTitle}</p>
          <p style={{ marginTop: "10px", fontSize: "14px" }}>
            {data.email}<br />
            {data.phone}<br />
            {data.address}, {data.city}, {data.country}
          </p>
        </div>
      </div>

      {/* PROFILE PANEL */}
      <div style={{
        background: "#F1F1F1",
        padding: "20px",
        borderRadius: "8px",
        marginTop: "30px"
      }}>
        <h2>Profile</h2>
        <p>{data.summary}</p>
      </div>

      {/* MAIN GRID */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "60% 40%",
        gap: "30px",
        marginTop: "30px"
      }}>

        {/* EXPERIENCE */}
        <div>
          <h2>Employment History</h2>

          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginTop: "20px" }}>
              <p
                style={{
                  background: "#000",
                  color: "white",
                  width: "fit-content",
                  padding: "2px 6px",
                  fontSize: "14px"
                }}
              >
                {exp.role} at {exp.company}
              </p>

              <p style={{ fontSize: "14px" }}>{exp.start} — {exp.end}</p>

              <ul>
                {exp.details.map((d, j) => <li key={j}>{d}</li>)}
              </ul>
            </div>
          ))}

          <h2 style={{ marginTop: "30px" }}>Education</h2>
          {data.education.map((edu, i) => (
            <p key={i}>
              <b>{edu.degree}</b><br />
              {edu.school}, {edu.location}<br />
              {edu.start} — {edu.end}
            </p>
          ))}

        </div>

        {/* RIGHT PANEL */}
        <div>

          {/* SKILLS */}
          <h2>Skills</h2>
          {data.skills.map((s, i) => (
            <div key={i} style={{
              display: "flex",
              justifyContent: "space-between",
              borderBottom: "2px dotted #999",
              padding: "5px 0"
            }}>
              <span>{s}</span>
              <span>5/5</span>
            </div>
          ))}

          {/* REFERENCES */}
          <h2 style={{ marginTop: "30px" }}>References</h2>

          <div style={{
            background: "#F1F1F1",
            padding: "15px",
            borderRadius: "8px"
          }}>
            {data.references?.map((ref, i) => (
              <p key={i} style={{ marginBottom: "15px" }}>{ref}</p>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
};

export default TemplateToronto;
