import torch
from torch import nn
from torch.utils.data import Dataset, DataLoader
import pandas as pd
import numpy as np
import os

# Define enums and struct (mapped to Python)
class Stroke:
    Other = 0
    Backhand = 1
    Overhead = 2
    Forehand = 3
    Count = 4

class Spin:
    Other = 0
    Slice = 1
    Flat = 2
    Topspin = 3
    Count = 4

class InferenceCharacteristic:
    def __init__(self, stroke, spin):
        self.stroke = stroke
        self.spin = spin

    def __repr__(self):
        return f"InferenceCharacteristic(stroke={self.stroke}, spin={self.spin})"

# Preprocessing
class SensorDataset(Dataset):
    def __init__(self, csv_file):
        if os.path.exists(csv_file):
            data = pd.read_csv(csv_file)
            self.timestamps = data.iloc[:, 0].values
            self.sensors = data.iloc[:, 1:7].values.astype(np.float32)  # 6 sensor channels (3 accel + 3 gyro)
            
            # Normalize to [-1, 1]
            self.sensors[:, :3] /= 4.0  # Accelerometer range ±4g
            self.sensors[:, 3:] /= 2000.0  # Gyroscope range ±2000 dps
            
            # Load labels (manually assigned for training)
            self.labels_stroke = data["stroke"].values.astype(int)  # Ensure labels are integers
            self.labels_spin = data["spin"].values.astype(int)  # Ensure labels are integers
        else:
            self.timestamps = np.array([])
            self.sensors = np.array([])
            self.labels_stroke = np.array([])
            self.labels_spin = np.array([])

    def __len__(self):
        return len(self.sensors)

    def __getitem__(self, idx):
        return (
            torch.tensor(self.sensors[idx]),  # Sensor data
            torch.tensor(self.labels_stroke[idx]),  # Stroke label
            torch.tensor(self.labels_spin[idx]),  # Spin label
        )

    def add_data(self, new_csv_file):
        if os.path.exists(new_csv_file):
            new_data = pd.read_csv(new_csv_file)
            new_timestamps = new_data.iloc[:, 0].values
            new_sensors = new_data.iloc[:, 1:7].values.astype(np.float32)
            new_sensors[:, :3] /= 4.0
            new_sensors[:, 3:] /= 2000.0
            new_labels_stroke = new_data["stroke"].values.astype(int)
            new_labels_spin = new_data["spin"].values.astype(int)

            # Append new data
            self.timestamps = np.concatenate((self.timestamps, new_timestamps))
            self.sensors = np.concatenate((self.sensors, new_sensors))
            self.labels_stroke = np.concatenate((self.labels_stroke, new_labels_stroke))
            self.labels_spin = np.concatenate((self.labels_spin, new_labels_spin))

# Define the 1D CNN model
class SensorNet(nn.Module):
    def __init__(self, num_stroke_classes=Stroke.Count, num_spin_classes=Spin.Count):
        super(SensorNet, self).__init__()
        self.conv = nn.Sequential(
            nn.Conv1d(in_channels=6, out_channels=16, kernel_size=3, stride=1, padding=1),  # 6 input channels (3 accel + 3 gyro)
            nn.ReLU(),
            nn.MaxPool1d(kernel_size=2, stride=2),  # Reduces sequence length by half
            nn.Conv1d(in_channels=16, out_channels=32, kernel_size=3, stride=1, padding=1),
            nn.ReLU(),
            nn.MaxPool1d(kernel_size=2, stride=2),
        )
        self.fc_stroke = nn.Sequential(
            nn.Linear(32 * 7, 120),  # Adjust based on your sequence length
            nn.ReLU(),
            nn.Linear(120, 84),
            nn.ReLU(),
            nn.Linear(84, num_stroke_classes),  # Output for stroke classification
        )
        self.fc_spin = nn.Sequential(
            nn.Linear(32 * 7, 120),  # Adjust based on your sequence length
            nn.ReLU(),
            nn.Linear(120, 84),
            nn.ReLU(),
            nn.Linear(84, num_spin_classes),  # Output for spin classification
        )

    def forward(self, x):
        x = self.conv(x)
        x = x.view(x.size(0), -1)  # Flatten
        stroke_output = self.fc_stroke(x)
        spin_output = self.fc_spin(x)
        return stroke_output, spin_output

# Initialize model, loss function, and optimizer
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = SensorNet().to(device)
criterion_stroke = nn.CrossEntropyLoss()
criterion_spin = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

# Function to train the model incrementally
def train_incrementally(model, dataset, num_epochs=10, batch_size=32):
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)
    model.train()
    for epoch in range(num_epochs):
        running_loss = 0.0
        for i, (sensor_data, stroke_labels, spin_labels) in enumerate(dataloader):
            sensor_data = sensor_data.to(device)
            stroke_labels = stroke_labels.to(device)
            spin_labels = spin_labels.to(device)

            # Forward pass
            stroke_output, spin_output = model(sensor_data.unsqueeze(2))  # Add channel dimension
            loss_stroke = criterion_stroke(stroke_output, stroke_labels)
            loss_spin = criterion_spin(spin_output, spin_labels)
            loss = loss_stroke + loss_spin

            # Backward pass and optimization
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            running_loss += loss.item()
            if i % 10 == 9:  # Print every 10 batches
                print(f"Epoch [{epoch+1}/{num_epochs}], Batch [{i+1}/{len(dataloader)}], Loss: {running_loss/10:.4f}")
                running_loss = 0.0

# Function to evaluate the model
def evaluate(model, dataset):
    dataloader = DataLoader(dataset, batch_size=32, shuffle=False)
    model.eval()
    correct_stroke, correct_spin, total = 0, 0, 0
    with torch.no_grad():
        for sensor_data, stroke_labels, spin_labels in dataloader:
            sensor_data = sensor_data.to(device)
            stroke_labels = stroke_labels.to(device)
            spin_labels = spin_labels.to(device)

            stroke_output, spin_output = model(sensor_data.unsqueeze(2))
            _, predicted_stroke = torch.max(stroke_output, 1)
            _, predicted_spin = torch.max(spin_output, 1)

            total += stroke_labels.size(0)
            correct_stroke += (predicted_stroke == stroke_labels).sum().item()
            correct_spin += (predicted_spin == spin_labels).sum().item()

    print(f"Stroke Accuracy: {100 * correct_stroke / total:.2f}%")
    print(f"Spin Accuracy: {100 * correct_spin / total:.2f}%")

# Main loop for incremental training
dataset = SensorDataset("sensor_data.csv")
while True:
    print("1. Add new data and train")
    print("2. Evaluate model")
    print("3. Exit")
    choice = input("Enter your choice: ")

    if choice == "1":
        new_csv_file = input("Enter the path to the new CSV file: ")
        dataset.add_data(new_csv_file)

        # Prompt user to specify the type of hit
        print("Select the stroke type:")
        print(f"0: Other, 1: Backhand, 2: Overhead, 3: Forehand")
        stroke_type = int(input("Enter the stroke type (0-3): "))
        print("Select the spin type:")
        print(f"0: Other, 1: Slice, 2: Flat, 3: Topspin")
        spin_type = int(input("Enter the spin type (0-3): "))

        # Update labels in the dataset for the new data
        # Assuming the new data is appended at the end of the dataset
        start_idx = len(dataset.labels_stroke) - len(pd.read_csv(new_csv_file))
        dataset.labels_stroke[start_idx:] = stroke_type
        dataset.labels_spin[start_idx:] = spin_type

        # Train incrementally
        train_incrementally(model, dataset)
        torch.save(model.state_dict(), "sensor_net.pth")  # Save model state
    elif choice == "2":
        evaluate(model, dataset)
    elif choice == "3":
        break
    else:
        print("Invalid choice. Please try again.")