import StudentProfile from "../models/StudentProfile.js";
import {
  companyInterviewExperiences,
  companyPreparationPaths,
  companyRoundBlueprints,
  interviewModes,
  interviewRounds,
  placementGuidance,
  placementSkillCatalog
} from "../utils/placementData.js";
import { buildStudentAnalytics } from "../services/analyticsService.js";
import { generatePersonalizedGuidance } from "../services/aiService.js";

export const getPlacementLibrary = async (req, res) => {
  res.json({
    success: true,
    data: {
      skills: placementSkillCatalog,
      companies: companyPreparationPaths,
      companyInterviewExperiences,
      companyRoundBlueprints,
      rounds: interviewRounds,
      modes: interviewModes,
      guidance: placementGuidance
    }
  });
};

export const updateStudentSkills = async (req, res, next) => {
  try {
    const { selectedCompany, selectedRole, placementSkills = [] } = req.body;
    const companyPath = companyPreparationPaths[selectedCompany] || companyPreparationPaths.TCS;
    const profile = await StudentProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        selectedCompany,
        selectedRole,
        placementSkills: placementSkills.length
          ? placementSkills
          : placementSkillCatalog
              .filter((skill) => companyPath.focus.includes(skill.name) || skill.topics.some((topic) => companyPath.focus.includes(topic)))
              .map((skill) => ({ ...skill, custom: false, progress: 0 }))
      },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const getPersonalizedGuidance = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user._id });
    const analytics = await buildStudentAnalytics(req.user._id);
    const companyPath = companyPreparationPaths[profile?.selectedCompany] || companyPreparationPaths.TCS;
    const aiGuidance = await generatePersonalizedGuidance({ analytics, profile, companyPath });
    res.json({
      success: true,
      data: {
        staticGuidance: placementGuidance,
        companyPath,
        aiGuidance
      }
    });
  } catch (error) {
    next(error);
  }
};
