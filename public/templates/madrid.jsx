import React from "react";

const TemplateMadrid = ({ data }) => {
  return (
    <div style={{ fontFamily: "Inter", maxWidth: "900px", margin: "auto", background: "#FFFFFF" }}>

      {/* YELLOW HEADER */}
      <div style={{
        background: "#FFE048",
        padding: "30px",
        display: "flex",
        alignItems: "center",
        gap: "20px"
      }}>
        <div style={{ width: "110px", height: "110px", borderRadius: "8px", overflow: "hidden" }}>
          <img src={data.photoURL} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

        <div>
          <h1 style={{ margin: 0 }}>{data.firstName} {data.lastName}</h1>
          <p>{data.jobTitle}</p>
        </div>
      </div>

      {/* DETAILS */}
      <div style={{ padding: "30px" }}>
        <h3>DETAILS</h3>
        <p>{data.address}<br />{data.city}<br />{data.country}<br />{data.email}<br />{data.phone}</p>

        <h3>PROFILE</h3>
        <p>{data.summary}</p>

        <h3>EDUCATION</h3>
        {data.education.map((edu, i) => (
          <p key={i}>
            <b>{edu.degree}</b><br />
            {edu.school}, {edu.location}<br />
            {edu.start} — {edu.end}
          </p>
        ))}

        <h3>EMPLOYMENT HISTORY</h3>
        {data.experience.map((exp, i) => (
          <div key={i} style={{ marginTop: "15px" }}>
            <p><b>{exp.role}</b>, {exp.company}, {exp.location}</p>
            <p style={{ fontStyle: "italic" }}>{exp.start} — {exp.end}</p>
            <ul>
              {exp.details.map((d, j) => <li key={j}>{d}</li>)}
            </ul>
          </div>
        ))}

        <h3>SKILLS</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "60px" }}>
          {data.skills.map((s, i) => (
            <div key={i}>
              <p>{s}</p>
              <div style={{ width: "200px", height: "5px", background: "#000" }}></div>
            </div>
          ))}
        </div>

        <h3>LANGUAGES</h3>
        {data.languages.map((lang, i) => (
          <div key={i}>
            <p>{lang}</p>
            <div style={{ width: "200px", height: "5px", background: "#444" }}></div>
          </div>
        ))}

      </div>

    </div>
  );
};

export default TemplateMadrid;
