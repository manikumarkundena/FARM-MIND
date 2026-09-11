from kaggle_environments import make

def dumb_agent(observation):
    return {
        "farmer": ["PASS"],
        "hands": [],
        "market": []
    }

env = make("kaggriculture")

env.run([
    dumb_agent,
    dumb_agent
])

print("Game completed!")
print("Final status:", env.state[0].status)