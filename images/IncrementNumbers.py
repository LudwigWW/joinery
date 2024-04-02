import os
import sys

folder_path = os.path.dirname(os.path.abspath(__file__))
prefix = 'jointType-'
extension = '.svg'
start_number = int(sys.argv[1])

# Get all the SVG files in the folder
files = [file for file in os.listdir(folder_path) if file.startswith(prefix) and file.endswith(extension)]

# Sort the files in reverse order
sorted_files = sorted(files, reverse=True)

# Rename the files
for file in sorted_files:
    file_number = int(file[len(prefix):-len(extension)])
    if file_number >= start_number:
        new_file_number = file_number + 1
        new_name = f'{prefix}{new_file_number:02d}{extension}'
        old_path = os.path.join(folder_path, file)
        new_path = os.path.join(folder_path, new_name)
        os.rename(old_path, new_path)