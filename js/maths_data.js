// Mission Boards: Maths Curriculum (Chapters 1-13)
// Structure: Flexible Playlist per Chapter

const mathsCurriculum = {
    1: {
        title: "Relations & Functions",
        target: "3 Hours / Finish Exercise 1.1 & 1.2",
        videos: [
            { title: "Exercise 1.1 (Q1-Q16) | Basics", id: "lAdTN8ZKlj4" },
            { title: "Types of Relations | Examples", id: "6SL91-DLTSI" },
            { title: "Functions One-One Onto", id: "Vw1LQoY1U3Q" },
            { title: "Composition of Functions", id: "Hg7iHaC7Lv8" },
            { title: "Invertible Functions", id: "kff_Y8BuGa4" },
            { title: "Binary Operations", id: "rC7lMYys_uc" }
        ]
    },
    2: {
        title: "Inverse Trigonometric Functions",
        target: "2.5 Hours / Finish Chapter",
        videos: [
            { title: "ITF Basics & Domain Range", id: "uwZ_HpfcErg" },
            { title: "Properties of ITF", id: "_S1bUSz35os" },
            { title: "Principal Value Branch", id: "wdEF4_NtFEw" },
            { title: "Miscellaneous Examples", id: "ddBILpwIt7g" }
        ]
    },
    3: {
        title: "Matrices",
        target: "3 Hours / Matrix Operations",
        videos: [
            { title: "Order of Matrix & Types", id: "wieCAEqnDko" },
            { title: "Operations on Matrices", id: "9yUUP7S8DxQ" },
            { title: "Transpose & Symmetric", id: "hsDS3nIvuCU" },
            { title: "Elementary Operations", id: "WQKFmWRp-X4" },
            { title: "Invertible Matrices", id: "En0BG-fdGVA" }
        ]
    },
    4: {
        title: "Determinants",
        target: "3 Hours / Properties & Area",
        videos: [
            { title: "Determinant Expansion", id: "N6vpy2q8dFc" },
            { title: "Properties of Determinants", id: "4_SJWMS0UVE" },
            { title: "Area of Triangle", id: "aPrdGXdK3gY" },
            { title: "Minors and Cofactors", id: "xemn9BzU3j4" },
            { title: "Adjoint and Inverse", id: "tauARpsg5m4" }
        ]
    },
    // ... (Isi tarah aap Chapter 5-13 add kar sakte hain)
    // Placeholder for logic testing:
    5: { title: "Continuity & Differentiability", target: "3 Hours", videos: [{title: "Limits & Continuity", id: "VIDEO_ID"}] },
    6: { title: "Application of Derivatives", target: "3 Hours", videos: [{title: "Rate of Change", id: "VIDEO_ID"}] },
    7: { title: "Integrals", target: "4 Hours (Big Chapter)", videos: [{title: "Integration Basics", id: "VIDEO_ID"}] },
    8: { title: "Application of Integrals", target: "2 Hours", videos: [{title: "Area under Curve", id: "VIDEO_ID"}] },
    9: { title: "Differential Equations", target: "3 Hours", videos: [{title: "Order & Degree", id: "VIDEO_ID"}] },
    10: { title: "Vector Algebra", target: "3 Hours", videos: [{title: "Vector Types", id: "VIDEO_ID"}] },
    11: { title: "Three Dimensional Geometry", target: "3 Hours", videos: [{title: "Direction Cosines", id: "VIDEO_ID"}] },
    12: { title: "Linear Programming", target: "2 Hours", videos: [{title: "LPP Graph", id: "VIDEO_ID"}] },
    13: { title: "Probability", target: "3 Hours", videos: [{title: "Conditional Probability", id: "VIDEO_ID"}] }
};