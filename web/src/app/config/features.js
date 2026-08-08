const isEnabled = (key) => {
  const value = import.meta.env[key];
  if (value === undefined || value === null || value === "") return false;
  return String(value).toLowerCase() === "true";
};

export const features = {
  advisorWorkspaceV2: isEnabled("VITE_ADVISOR_WORKSPACE_V2"),
};
