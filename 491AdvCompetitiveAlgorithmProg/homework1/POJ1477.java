import java.io.*;
import java.util.*;
import java.lang.*;
public class Main
{
public static void main(String args[]) throws Exception
	{
		int counter = 1;
		Scanner cin=new Scanner(System.in);
		int stacks=cin.nextInt();
		while(stacks!=0)
		{
			int[] numbers = new int[stacks];
			int result = 0;
			int sum = 0;
			int avg = 0;
			for (int i=0; i<stacks; i++)
			{
				numbers[i] = cin.nextInt();
				sum = sum + numbers[i];
			}
			avg = sum/stacks;
			for (int j=0; j<stacks; j++)
			{
				result = result + Math.abs(numbers[j]-avg);
			}
			result = result/2;

			System.out.println("Set #"+counter);
			System.out.println("The minimum number of moves is "+result+".\n");
			counter = counter + 1;
			stacks=cin.nextInt();
		}
	}
}