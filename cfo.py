import os
from crewai import Agent, Task, Crew, Process, LLM
from dotenv import load_dotenv

# Load environment variables (API Keys)
load_dotenv()

def get_cfo_analysis(simulation_json):
    """
    Spins up a CrewAI agent to analyze the simulation results.
    """
    
    # 1. Setup the Brain (Groq/Llama3)
    # Checks for the key in .env
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return "Error: No API Key found. Please check .env file."

    my_llm = LLM(
        model="groq/llama-3.3-70b-versatile",
        api_key=api_key
    )

    # 2. Define the Agent: The Ruthless CFO
    cfo = Agent(
        role='Ruthless CFO',
        goal='Analyze financial simulation data and find the single most painful but effective action to build wealth faster.',
        backstory="""You are a private equity CFO known for brutal efficiency. 
        You do not care about "feelings" or "fun money". You care about Net Worth and Debt Eradication.
        You look at the user's "Wealth Builder" or "Kill Debt" projections and tell them exactly where they are failing.
        Your advice is short, punchy, and mathematically grounded.""",
        llm=my_llm,
        verbose=False
    )

    # 3. Define the Task
    # We pass the simulation JSON output as context
    analysis_task = Task(
        description=f"""
        Analyze this financial simulation JSON output:
        {simulation_json}

        Identify:
        1. The projected "Debt Free Date".
        2. The total interest paid.
        3. A critique of their current allocation.

        OUTPUT REQUIREMENT:
        Provide a 3-sentence strategic directive. 
        Sentence 1: State the hard truth (e.g., "You are bleeding money on interest.").
        Sentence 2: The specific fix (e.g., "Reallocate 20% of your Fun Money to the Personal Loan.").
        Sentence 3: The outcome (e.g., "This saves you ₹40k and clears debt 5 months early.").
        """,
        expected_output='A 3-sentence strategic directive.',
        agent=cfo
    )

    # 4. Run the Crew
    crew = Crew(
        agents=[cfo],
        tasks=[analysis_task],
        process=Process.sequential
    )

    return crew.kickoff()