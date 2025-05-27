import { v4 as uuidv4 } from 'uuid';

const DEFAULT_TEMPLATE_FILES = [
  {
    name: 'Executive Summary.md',
    type: 'markdown',
    content: 'Overview of deal, goals, and strategic narrative.',
  },
  {
    name: 'Buying Committee.json',
    type: 'json',
    content: `{
  "Champion": "Emily (Head of Data)",
  "Economic Buyer": "Jon (CFO)",
  "Security": "Ana (CISO)",
  "Procurement": "Sergio"
}`,
  },
  {
    name: 'Common Objections.md',
    type: 'markdown',
    content: '- What if OpenAI changes pricing?\n- How do we keep data private?\n- Why not build it ourselves?',
  },
  // ... Add more from the default list (trimmed here for brevity)
];

export async function createProjectWithTemplate(
  supabase: any,
  projectName: string,
  userId: string,
  activeTeamId: string
) {
  // Step 1: Create project
  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .insert([
      {
        name: projectName,
        owner_id: userId,
        team_id: activeTeamId,
      },
    ])
    .select()
    .single();

  if (projectError || !projectData) {
    console.error('Error creating project:', projectError);
    return null;
  }

  const projectId = projectData.id;

  // Step 2: Create files and file_versions
  for (const templateFile of DEFAULT_TEMPLATE_FILES) {
    const fileId = uuidv4();

    const { data: fileData, error: fileError } = await supabase
      .from('files')
      .insert([
        {
          id: fileId,
          project_id: projectId,
          name: templateFile.name,
          type: templateFile.type,
          created_by: userId,
        },
      ])
      .select()
      .single();

    if (fileError) {
      console.error(`Error creating file ${templateFile.name}:`, fileError);
      continue;
    }

    await supabase.from('file_versions').insert([
      {
        file_id: fileId,
        content: templateFile.content,
        created_by: userId,
        comment: 'Initial template file',
      },
    ]);
  }

  return projectId;
}
