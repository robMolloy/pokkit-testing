export const createOrganisationRecordSeedData = () => {
  const randomNum = Math.floor(Math.random() * 1000);
  return {
    name: `Test Organisation ${randomNum}`,
    description: `This is a test organisation ${randomNum}`,
  };
};
